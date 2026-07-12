#include "link_layer.h"
#include "proto_pack.h"

#include <cobs/Print.h>
#include <cobs/Stream.h>
#include <pb_arduino.h>

extern "C" {
#include "sensedial_proto_identity.h"
}

namespace
{
    // Transport and protocol layer for the low-side links.
    //
    // Kept here:
    // - COBS framing and unframing
    // - protobuf encode and decode
    // - protocol_info handshake and version/hash validation
    // - per-link readiness gating
    // - session reset when a link disappears
    //
    // Not kept here:
    // - application behavior for request_state, host_command, or dial_config
    // - protobuf message builders
    // A full DialConfig (including detent overrides and input channels) is
    // larger than 512 bytes in the generated nanopb schema.
    static constexpr size_t RX_PACKET_MAX = 1280;
    static constexpr uint32_t RX_PACKET_TIMEOUT_MS = 250;
    static constexpr uint32_t HIGHSIDE_SESSION_TIMEOUT_MS = 2000;
    static constexpr uint32_t HIGHSIDE_PROTOCOL_REQUEST_RETRY_MS = 250;
    static constexpr size_t TX_PACKET_MAX = 1280;
    static constexpr size_t TX_FRAME_MAX = TX_PACKET_MAX + (TX_PACKET_MAX / 254) + 2;

    enum class LinkProtocolState : uint8_t
    {
        WaitProtocolInfo,
        Ready,
        Failed,
    };

    uint16_t g_host_protocol_nonce = 1;
    uint16_t g_highside_protocol_nonce = 1;
    bool g_forward_protocol_info_pending = false;
    LinkProtocolState g_host_protocol_state = LinkProtocolState::WaitProtocolInfo;
    LinkProtocolState g_highside_protocol_state = LinkProtocolState::WaitProtocolInfo;
    uint32_t g_host_last_activity_ms = 0;
    uint32_t g_highside_last_activity_ms = 0;
    uint32_t g_highside_protocol_request_ms = 0;
    bool g_highside_protocol_request_pending = false;

    Stream *g_host_stream = nullptr;
    Stream *g_device_stream = nullptr;
    bool g_host_connected = false;
    bool g_device_connected = false;

    packetio::COBSStream *g_host_cobs_in = nullptr;
    packetio::COBSStream *g_device_cobs_in = nullptr;

    // Link processing is owned exclusively by core 0, so these buffers can be
    // reused. Keeping them out of nested call stacks prevents stack exhaustion
    // when a full-size protobuf response is sent from inside a receive handler.
    uint8_t g_rx_packet[RX_PACKET_MAX] = {};
    uint8_t g_tx_payload[TX_PACKET_MAX] = {};
    uint8_t g_tx_frame[TX_FRAME_MAX] = {};

    const char *g_last_error = nullptr;

    void reset_host_session()
    {
        g_host_protocol_state = LinkProtocolState::WaitProtocolInfo;
        g_host_last_activity_ms = 0;
        g_forward_protocol_info_pending = false;
        g_last_error = nullptr;
    }

    void reset_highside_session()
    {
        g_highside_protocol_state = LinkProtocolState::WaitProtocolInfo;
        g_highside_last_activity_ms = 0;
        g_highside_protocol_request_ms = 0;
        // The board-to-board link is autonomous and must recover even when no
        // USB host is attached.
        g_highside_protocol_request_pending = true;
    }

    void drain_available(Stream *stream)
    {
        if (stream == nullptr) {
            return;
        }
        while (stream->available() > 0) {
            stream->read();
        }
    }

    bool read_packet(packetio::COBSStream &in, uint8_t *buffer, size_t &len)
    {
        len = 0;
        const uint32_t start = millis();

        while ((millis() - start) < RX_PACKET_TIMEOUT_MS) {
            int c = in.read();

            if (c == packetio::PacketStream::EOF) {
                delay(1);
                continue;
            }

            if (c == packetio::PacketStream::EOP) {
                in.next();
                return true;
            }

            if (len >= RX_PACKET_MAX) {
                g_last_error = "packet too large";
                in.next();
                return false;
            }

            buffer[len++] = static_cast<uint8_t>(c);
        }

        g_last_error = "timeout waiting for packet";
        return false;
    }

    bool decode_packet(packetio::COBSStream &in, const pb_msgdesc_t *fields, void *msg)
    {
        size_t len = 0;

        if (!read_packet(in, g_rx_packet, len)) {
            return false;
        }

        pb_istream_t istream = pb_istream_from_buffer(g_rx_packet, len);
        if (!pb_decode(&istream, fields, msg)) {
            g_last_error = PB_GET_ERROR(&istream);
            return false;
        }

        g_last_error = nullptr;
        return true;
    }

    size_t cobs_encode_buffer(const uint8_t *input, size_t length, uint8_t *output, size_t output_size)
    {
        if (output_size == 0) {
            return 0;
        }

        size_t read_index = 0;
        size_t write_index = 1;
        size_t code_index = 0;
        uint8_t code = 1;

        while (read_index < length) {
            if (write_index >= output_size) {
                return 0;
            }

            if (input[read_index] == 0) {
                output[code_index] = code;
                code = 1;
                code_index = write_index++;
                read_index++;
                continue;
            }

            output[write_index++] = input[read_index++];
            code++;

            if (code == 0xFF) {
                output[code_index] = code;
                code = 1;
                code_index = write_index++;
            }
        }

        if (code_index >= output_size) {
            return 0;
        }

        output[code_index] = code;
        return write_index;
    }

    bool encode_and_send(Stream &out, const pb_msgdesc_t *fields, const void *msg)
    {
        pb_ostream_t pb_out = pb_ostream_from_buffer(g_tx_payload, sizeof(g_tx_payload));
        if (!pb_encode(&pb_out, fields, msg)) {
            g_last_error = PB_GET_ERROR(&pb_out);
            return false;
        }

        size_t frame_len = cobs_encode_buffer(
            g_tx_payload, pb_out.bytes_written, g_tx_frame, sizeof(g_tx_frame));
        if (frame_len == 0 || frame_len >= sizeof(g_tx_frame)) {
            g_last_error = "cobs encode failed";
            return false;
        }

        g_tx_frame[frame_len++] = 0x00;

        const size_t written = out.write(g_tx_frame, frame_len);
        if (written != frame_len) {
            g_last_error = "stream write failed";
            return false;
        }

        out.flush();
        g_last_error = nullptr;
        return true;
    }

    bool protocol_info_valid(const SenseDial_LowSide_ProtocolInfo &info)
    {
        return (info.protocol_version == SENSEDIAL_LOWSIDE_PROTO_VERSION) &&
               (info.protocol_hash == SENSEDIAL_LOWSIDE_PROTO_HASH);
    }

    bool handle_host_protocol_message(const SenseDial_LowSide_FromHost &msg)
    {
        if (msg.which_payload != SenseDial_LowSide_FromHost_protocol_info_tag) {
            return false;
        }

        if (!protocol_info_valid(msg.payload.protocol_info)) {
            g_host_protocol_state = LinkProtocolState::Failed;
            g_last_error = "host protocol mismatch";
            send_to_host(pack(to_host::log(g_last_error, msg.nonce)));
            return false;
        }

        g_host_protocol_state = LinkProtocolState::Ready;
        g_host_last_activity_ms = millis();
        g_highside_protocol_request_pending = true;
        g_highside_protocol_request_ms = 0;
        return send_to_host(pack(to_host::ack(msg.nonce)));
    }

    bool handle_highside_protocol_message(const SenseDial_LowSide_FromHighSide &msg)
    {
        if (msg.which_payload != SenseDial_LowSide_FromHighSide_protocol_info_tag) {
            return false;
        }

        if (!protocol_info_valid(msg.payload.protocol_info)) {
            g_highside_protocol_state = LinkProtocolState::Failed;
            g_last_error = "highside protocol mismatch";
            return false;
        }

        g_highside_protocol_state = LinkProtocolState::Ready;
        g_highside_last_activity_ms = millis();
        g_highside_protocol_request_pending = false;
        return send_to_highside(pack(to_highside::ack(msg.nonce)));
    }
}

void link_layer_init(Stream &host_stream, Stream &device_stream)
{
    g_host_stream = &host_stream;
    g_device_stream = &device_stream;
    g_host_connected = static_cast<bool>(&host_stream);
    g_device_connected = static_cast<bool>(&device_stream);

    static packetio::COBSStream host_cobs_in_impl(*g_host_stream);
    static packetio::COBSStream device_cobs_in_impl(*g_device_stream);

    g_host_cobs_in = &host_cobs_in_impl;
    g_device_cobs_in = &device_cobs_in_impl;
    g_host_protocol_state = LinkProtocolState::WaitProtocolInfo;
    g_highside_protocol_state = LinkProtocolState::WaitProtocolInfo;
    g_host_last_activity_ms = 0;
    g_highside_last_activity_ms = 0;
    g_highside_protocol_request_pending = true;
    g_highside_protocol_request_ms = 0;
    g_last_error = nullptr;
}

void link_layer_service()
{
    if (!g_host_connected) {
        reset_host_session();
    }

    if (!g_device_connected) {
        reset_highside_session();
    }

    // USB serial has no reliable inactivity/disconnect signal.  A quiet host is
    // still an authenticated host; a fresh protocol_info frame can replace the
    // session at any time (also after a PC reconnect).

    if (g_highside_protocol_state == LinkProtocolState::Ready &&
        g_highside_last_activity_ms != 0 &&
        (millis() - g_highside_last_activity_ms) > HIGHSIDE_SESSION_TIMEOUT_MS) {

        g_last_error = "highside session timeout";
        reset_highside_session();
    }

    if (g_highside_protocol_state != LinkProtocolState::Ready &&
        g_highside_protocol_request_pending &&
        (g_highside_protocol_request_ms == 0 ||
         (millis() - g_highside_protocol_request_ms) >= HIGHSIDE_PROTOCOL_REQUEST_RETRY_MS)) {

        if (send_protocol_request_to_highside()) {
            g_highside_protocol_request_ms = millis();
        }
    }
}

const char *link_layer_last_error()
{
    return g_last_error;
}

bool link_layer_host_ready()
{
    return g_host_protocol_state == LinkProtocolState::Ready;
}

bool link_layer_highside_ready()
{
    return g_highside_protocol_state == LinkProtocolState::Ready;
}

bool send_to_host(const SenseDial_LowSide_ToHost &msg)
{
    if (g_host_stream == nullptr) {
        g_last_error = "host output not initialized";
        return false;
    }

    return encode_and_send(*g_host_stream, SenseDial_LowSide_ToHost_fields, &msg);
}

bool send_to_highside(const SenseDial_LowSide_ToHighSide &msg)
{
    if (g_device_stream == nullptr) {
        g_last_error = "device output not initialized";
        return false;
    }

    return encode_and_send(*g_device_stream, SenseDial_LowSide_ToHighSide_fields, &msg);
}

bool receive_from_host(SenseDial_LowSide_FromHost &msg)
{
    if (g_host_cobs_in == nullptr) {
        g_last_error = "host input not initialized";
        return false;
    }

    msg = SenseDial_LowSide_FromHost_init_zero;
    if (!decode_packet(*g_host_cobs_in, SenseDial_LowSide_FromHost_fields, &msg)) {
        // Do not tear down an authenticated session because one USB packet was
        // fragmented or malformed.  The next complete protocol_info can always
        // establish a new session.
        return false;
    }

    if (msg.which_payload == SenseDial_LowSide_FromHost_protocol_info_tag) {
        handle_host_protocol_message(msg);
        return false;
    }

    // Host messages stay blocked until the handshake succeeds.
    if (g_host_protocol_state != LinkProtocolState::Ready) {
        return false;
    }

    g_host_last_activity_ms = millis();

    return true;
}

bool poll_from_host(SenseDial_LowSide_FromHost &msg)
{
    if (g_host_stream == nullptr) {
        g_last_error = "host stream not initialized";
        return false;
    }

    if (g_host_stream->available() <= 0) {
        return false;
    }

    return receive_from_host(msg);
}

bool receive_from_highside(SenseDial_LowSide_FromHighSide &msg)
{
    if (g_device_cobs_in == nullptr) {
        g_last_error = "device input not initialized";
        return false;
    }

    msg = SenseDial_LowSide_FromHighSide_init_zero;
    if (!decode_packet(*g_device_cobs_in, SenseDial_LowSide_FromHighSide_fields, &msg)) {
        return false;
    }

    if (msg.which_payload == SenseDial_LowSide_FromHighSide_protocol_info_tag) {
        handle_highside_protocol_message(msg);
        // Only pass to app layer when the host explicitly requested a forward.
        if (g_forward_protocol_info_pending) {
            g_forward_protocol_info_pending = false;
            return true;
        }
        return false;
    }

    // High-side messages stay blocked until the handshake succeeds.
    if (g_highside_protocol_state != LinkProtocolState::Ready) {
        return false;
    }

    // Any valid high-side frame refreshes the authenticated session lifetime.
    g_highside_last_activity_ms = millis();
    return true;
}

bool poll_from_highside(SenseDial_LowSide_FromHighSide &msg)
{
    if (g_device_stream == nullptr) {
        g_last_error = "device stream not initialized";
        return false;
    }

    if (g_device_stream->available() <= 0) {
        return false;
    }

    return receive_from_highside(msg);
}

bool send_protocol_request_to_host()
{
    return send_to_host(pack(to_host::protocol_request(g_host_protocol_nonce++)));
}

bool send_protocol_request_to_highside()
{
    return send_to_highside(pack(to_highside::protocol_request(g_highside_protocol_nonce++)));
}

void link_layer_request_forward_protocol_info()
{
    g_forward_protocol_info_pending = true;
}
