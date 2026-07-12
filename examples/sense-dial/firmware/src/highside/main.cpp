#include <Arduino.h>
#include <cobs/Print.h>
#include <cobs/Stream.h>
#include <pb_arduino.h>
#include <Update.h>
#include "dial_ui.h"
#include "display_port.h"

extern "C" {
#include "sensedial_lowside.pb.h"
#include "sensedial_proto_identity.h"
}

namespace
{
    static HardwareSerial &DEVICE_UART = Serial1;

    static constexpr uint32_t DEVICE_UART_BAUD = 115200;
    // Empty UART polls must stay short so the 20 Hz display update remains
    // responsive even while the low-side is disconnected.
    static constexpr uint32_t RX_PACKET_TIMEOUT_MS = 4;
    static constexpr size_t RX_PACKET_MAX = 512;
    static constexpr size_t TX_PACKET_MAX = 512;
    static constexpr size_t TX_FRAME_MAX = TX_PACKET_MAX + (TX_PACKET_MAX / 254) + 2;

    packetio::COBSStream *g_device_cobs_in = nullptr;
    uint16_t g_nonce = 2;
    bool g_link_ready = false;
    uint32_t g_last_protocol_info_ms = 0;
    uint32_t g_last_state_request_ms = 0;
    uint32_t g_last_dial_state_ms = 0;
    uint32_t g_last_diagnostic_ms = 0;
    uint32_t g_rx_frames = 0;
    uint32_t g_tx_frames = 0;
    bool g_ota_active = false;
    uint32_t g_ota_size = 0;
    uint32_t g_ota_received = 0;
    uint32_t g_ota_expected_crc = 0;
    uint32_t g_ota_crc = 0xFFFFFFFFu;

    uint32_t update_crc32(uint32_t crc, const uint8_t *data, size_t size)
    {
        while (size--) {
            crc ^= *data++;
            for (uint8_t bit = 0; bit < 8; ++bit)
                crc = (crc >> 1) ^ (0xEDB88320u & (0u - (crc & 1u)));
        }
        return crc;
    }

    void ota_start(const SenseDial_LowSide_FirmwareUpdateStart &start)
    {
        g_ota_active = start.image_size > 0 && Update.begin(start.image_size, U_FLASH);
        g_ota_size = start.image_size;
        g_ota_received = 0;
        g_ota_expected_crc = start.expected_crc32;
        g_ota_crc = 0xFFFFFFFFu;
        Serial.printf("[HS] OTA start size=%lu active=%u\n",
                      static_cast<unsigned long>(g_ota_size), g_ota_active ? 1u : 0u);
    }

    void ota_chunk(const SenseDial_LowSide_FirmwareUpdateChunk &chunk)
    {
        if (!g_ota_active || chunk.offset != g_ota_received) {
            Serial.printf("[HS] OTA offset error expected=%lu got=%lu\n",
                          static_cast<unsigned long>(g_ota_received),
                          static_cast<unsigned long>(chunk.offset));
            Update.abort();
            g_ota_active = false;
            return;
        }
        const size_t size = chunk.data.size;
        if (Update.write(const_cast<uint8_t *>(chunk.data.bytes), size) != size) {
            Serial.printf("[HS] OTA write failed: %s\n", Update.errorString());
            Update.abort();
            g_ota_active = false;
            return;
        }
        g_ota_crc = update_crc32(g_ota_crc, chunk.data.bytes, size);
        g_ota_received += size;
    }

    void ota_finish()
    {
        const uint32_t crc = g_ota_crc ^ 0xFFFFFFFFu;
        const bool valid = g_ota_active &&
            g_ota_received == g_ota_size &&
            (g_ota_expected_crc == 0 || crc == g_ota_expected_crc);
        const bool complete = valid && Update.end(true);
        Serial.printf("[HS] OTA finish bytes=%lu crc=%08lx complete=%u\n",
                      static_cast<unsigned long>(g_ota_received),
                      static_cast<unsigned long>(crc), complete ? 1u : 0u);
        g_ota_active = false;
        if (complete) {
            delay(150);
            ESP.restart();
        } else {
            Update.abort();
        }
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
                ++read_index;
                continue;
            }

            output[write_index++] = input[read_index++];
            ++code;

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
                return len > 0;
            }

            if (len >= RX_PACKET_MAX) {
                in.next();
                Serial.println("[HS] read_packet: overflow");
                return false;
            }

            buffer[len++] = static_cast<uint8_t>(c);
        }

        return false;
    }

    bool decode_packet(const pb_msgdesc_t *fields, void *msg)
    {
        if (g_device_cobs_in == nullptr) {
            Serial.println("[HS] decode_packet: cobs_in null");
            return false;
        }

        uint8_t buffer[RX_PACKET_MAX];
        size_t len = 0;

        if (!read_packet(*g_device_cobs_in, buffer, len)) {
            return false;
        }

        pb_istream_t istream = pb_istream_from_buffer(buffer, len);
        return pb_decode(&istream, fields, msg);
    }

    bool encode_and_send(Stream &out, const pb_msgdesc_t *fields, const void *msg)
    {
        uint8_t payload[TX_PACKET_MAX];
        pb_ostream_t pb_out = pb_ostream_from_buffer(payload, sizeof(payload));
        if (!pb_encode(&pb_out, fields, msg)) {
            return false;
        }

        uint8_t frame[TX_FRAME_MAX];
        size_t frame_len = cobs_encode_buffer(payload, pb_out.bytes_written, frame, sizeof(frame));
        if (frame_len == 0 || frame_len >= sizeof(frame)) {
            return false;
        }

        frame[frame_len++] = 0x00;
        const size_t written = out.write(frame, frame_len);
        out.flush();
        if (written == frame_len) ++g_tx_frames;
        return written == frame_len;
    }

    SenseDial_LowSide_FromHighSide make_from_highside_envelope(uint16_t nonce)
    {
        SenseDial_LowSide_FromHighSide msg = SenseDial_LowSide_FromHighSide_init_zero;
        msg.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
        msg.nonce = nonce;
        return msg;
    }

    bool send_protocol_info()
    {
        Serial.println("[HS] send_protocol_info");
        auto msg = make_from_highside_envelope(1);
        msg.which_payload = SenseDial_LowSide_FromHighSide_protocol_info_tag;
        msg.payload.protocol_info.protocol_version = SENSEDIAL_LOWSIDE_PROTO_VERSION;
        msg.payload.protocol_info.protocol_hash = SENSEDIAL_LOWSIDE_PROTO_HASH;
        bool ok = encode_and_send(DEVICE_UART, SenseDial_LowSide_FromHighSide_fields, &msg);
        Serial.printf("[HS] send_protocol_info: encode_and_send=%s\n", ok ? "ok" : "fail");
        return ok;
    }

    bool send_state_request()
    {
        auto msg = make_from_highside_envelope(g_nonce++);
        msg.which_payload = SenseDial_LowSide_FromHighSide_request_state_tag;
        msg.payload.request_state = SenseDial_LowSide_RequestState_init_zero;
        return encode_and_send(DEVICE_UART, SenseDial_LowSide_FromHighSide_fields, &msg);
    }

    void handle_to_highside(const SenseDial_LowSide_ToHighSide &msg)
    {
        switch (msg.which_payload) {
            case SenseDial_LowSide_ToHighSide_request_protocol_info_tag:
                send_protocol_info();
                break;

            case SenseDial_LowSide_ToHighSide_ack_tag:
                if (msg.payload.ack.nonce == 1) {
                    g_link_ready = true;
                    Serial.println("[HS] protobuf link ready");
                }
                break;

            case SenseDial_LowSide_ToHighSide_dial_state_tag:
                g_last_dial_state_ms = millis();
                dial_ui_set_state(msg.payload.dial_state);
                break;

            case SenseDial_LowSide_ToHighSide_low_side_status_tag:
                dial_ui_set_status(msg.payload.low_side_status);
                break;

            case SenseDial_LowSide_ToHighSide_firmware_update_start_tag:
                ota_start(msg.payload.firmware_update_start);
                break;

            case SenseDial_LowSide_ToHighSide_firmware_update_chunk_tag:
                ota_chunk(msg.payload.firmware_update_chunk);
                break;

            case SenseDial_LowSide_ToHighSide_firmware_update_finish_tag:
                ota_finish();
                break;

            default:
                break;
        }
    }
}

void setup()
{
    Serial.begin(115200);
    delay(500);
    Serial.println("[HS] setup start");

    if (highside_display_init()) {
        dial_ui_create();
    } else {
        Serial.println("[HS] display initialization failed");
    }

#if defined(HIGHSIDE_UART_RX_PIN) && defined(HIGHSIDE_UART_TX_PIN)
    DEVICE_UART.begin(DEVICE_UART_BAUD, SERIAL_8N1, HIGHSIDE_UART_RX_PIN, HIGHSIDE_UART_TX_PIN);
#else
    DEVICE_UART.begin(DEVICE_UART_BAUD);
#endif

    static packetio::COBSStream device_cobs_in_impl(DEVICE_UART);
    g_device_cobs_in = &device_cobs_in_impl;
    send_protocol_info();
    g_last_protocol_info_ms = millis();
}

void loop()
{
    const uint32_t now = millis();
    if (!g_link_ready && now - g_last_protocol_info_ms >= 250) {
        g_last_protocol_info_ms = now;
        send_protocol_info();
    }
    if (g_link_ready && !g_ota_active && now - g_last_state_request_ms >= 50) {
        g_last_state_request_ms = now;
        send_state_request();
    }
    if (g_last_dial_state_ms && now - g_last_dial_state_ms > 3000) {
        dial_ui_set_connected(false);
        g_last_dial_state_ms = 0;
        g_link_ready = false;
        Serial.println("[HS] dial state timeout; restarting handshake");
    }
    if (now - g_last_diagnostic_ms >= 1000) {
        g_last_diagnostic_ms = now;
        Serial.printf("[HS] link=%s uart_rx_bytes=%d rx_frames=%lu tx_frames=%lu\n",
                      g_link_ready ? "ready" : "waiting",
                      DEVICE_UART.available(),
                      static_cast<unsigned long>(g_rx_frames),
                      static_cast<unsigned long>(g_tx_frames));
    }

    SenseDial_LowSide_ToHighSide incoming = SenseDial_LowSide_ToHighSide_init_zero;
    if (!decode_packet(SenseDial_LowSide_ToHighSide_fields, &incoming)) {
        return;
    }

    ++g_rx_frames;
    handle_to_highside(incoming);
}
