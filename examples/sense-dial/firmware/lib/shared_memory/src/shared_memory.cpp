#include "shared_memory.h"

#include <pico/critical_section.h>
#include <string.h>

namespace
{
    critical_section_t g_lock;
    bool g_lock_initialized = false;

    // Single shared snapshot protected by a cross-core critical section.
    LowSideSharedState g_state = {};

    void ensure_initialized()
    {
        if (!g_lock_initialized) {
            shared_memory_init();
        }
    }
}

void shared_memory_init()
{
    if (g_lock_initialized) {
        return;
    }

    // Initialize the lock before the first read or write.
    critical_section_init(&g_lock);
    g_state = LowSideSharedState{};
    g_lock_initialized = true;
}

namespace shared {

LowSideSharedState read(from_shared::snapshot_t)
{
    ensure_initialized();
    LowSideSharedState out = {};
    critical_section_enter_blocking(&g_lock);
    out = g_state;
    critical_section_exit(&g_lock);
    return out;
}

void write(const MotorSharedConfig &config)
{
    ensure_initialized();
    critical_section_enter_blocking(&g_lock);
    g_state.motor_config = config;
    critical_section_exit(&g_lock);
}

void write(const MotorSharedCommand &command)
{
    ensure_initialized();
    critical_section_enter_blocking(&g_lock);
    g_state.motor_command = command;
    critical_section_exit(&g_lock);
}

void write(const MotorSharedStatus &status)
{
    ensure_initialized();
    critical_section_enter_blocking(&g_lock);
    g_state.motor_status = status;
    critical_section_exit(&g_lock);
}

void write(const LinkSharedStatus& status)
{
    ensure_initialized();
    critical_section_enter_blocking(&g_lock);
    g_state.protocol.link_status.host_ready = status.host_ready;
    g_state.protocol.link_status.highside_ready = status.highside_ready;
    g_state.protocol.link_status.uptime_ms = status.uptime_ms;
    critical_section_exit(&g_lock);
}

} // namespace shared
