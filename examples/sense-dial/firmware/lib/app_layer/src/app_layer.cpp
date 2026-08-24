#include "app_layer.h"
#include "app_handlers.h"
#include "link_layer.h"
#include "shared_memory.h"

// Poll both links, refresh the shared snapshot, and dispatch authenticated messages.
void app_layer_run()
{
    link_layer_service();

    // Link state snapshot before the link.
    shared::write(LinkSharedStatus{
    .host_ready = link_layer_host_ready(),
    .highside_ready = link_layer_highside_ready(),
    .uptime_ms = millis(),
    });

    // Poll low-side from host link and dispatch messages to handlers.
    SenseDial_LowSide_FromHost host_msg = SenseDial_LowSide_FromHost_init_zero;
    if (poll_from_host(host_msg)) {
        handle_from_host(host_msg);
    }

    // Poll low-side from high-side link and dispatch messages to handlers.
    SenseDial_LowSide_FromHighSide highside_msg = SenseDial_LowSide_FromHighSide_init_zero;
    if (poll_from_highside(highside_msg)) {
        handle_from_highside(highside_msg);
    }

    // Link state snapshot after the link.
    shared::write(LinkSharedStatus{
    .host_ready = link_layer_host_ready(),
    .highside_ready = link_layer_highside_ready(),
    .uptime_ms = millis(),
    });
}
