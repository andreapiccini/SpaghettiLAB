#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/pio.h"
#include "ws2812.pio.h"

#define LED_PIN        3
#define LED_COUNT      4
#define MAX_BRIGHTNESS 60

static inline uint32_t urgb_u32(uint8_t r, uint8_t g, uint8_t b) {
    return ((uint32_t)g << 16) | ((uint32_t)r << 8) | (uint32_t)b;
}
static inline uint32_t rgb_s(uint8_t r, uint8_t g, uint8_t b) {
    return urgb_u32((r*MAX_BRIGHTNESS)/255, (g*MAX_BRIGHTNESS)/255, (b*MAX_BRIGHTNESS)/255);
}

// After every frame the PIO idles with pin LOW.
// Through the inverter the LED sees HIGH → no reset.
// Drive GPIO3 HIGH for 120µs → inverter → LED sees LOW = SK6812 reset.
static void reset_leds(PIO pio, uint sm) {
    sleep_us(200);                                          // let PIO clock out last bit
    gpio_set_function(LED_PIN, GPIO_FUNC_SIO);
    gpio_set_dir(LED_PIN, GPIO_OUT);                        // ← must set OUTPUT or pin is hi-Z
    gpio_put(LED_PIN, 1);                                   // HIGH → inverter → LED LOW = SK6812 reset
    sleep_us(120);
    gpio_set_function(LED_PIN, GPIO_FUNC_PIO0);             // return to PIO
    pio_sm_set_consecutive_pindirs(pio, sm, LED_PIN, 1, true); // restore PIO output direction
}

static void show(PIO pio, uint sm, uint32_t *buf, int n) {
    for (int i = 0; i < n; i++)
        pio_sm_put_blocking(pio, sm, buf[i] << 8u);
    reset_leds(pio, sm);
}

int main() {
    stdio_init_all();

    PIO  pio    = pio0;
    uint sm     = 0;
    uint offset = pio_add_program(pio, &ws2812_inverted_program);
    ws2812_inverted_program_init(pio, sm, offset, LED_PIN, 800000.0f, false);

    uint32_t buf[LED_COUNT];

    while (true) {
        // Red
        for (int i = 0; i < LED_COUNT; i++) buf[i] = rgb_s(255, 0, 0);
        show(pio, sm, buf, LED_COUNT);  sleep_ms(2000);

        // Green
        for (int i = 0; i < LED_COUNT; i++) buf[i] = rgb_s(0, 255, 0);
        show(pio, sm, buf, LED_COUNT);  sleep_ms(2000);

        // Blue
        for (int i = 0; i < LED_COUNT; i++) buf[i] = rgb_s(0, 0, 255);
        show(pio, sm, buf, LED_COUNT);  sleep_ms(2000);

        // Chase
        for (int c = 0; c < 4; c++) {
            for (int pos = 0; pos < LED_COUNT; pos++) {
                for (int i = 0; i < LED_COUNT; i++)
                    buf[i] = (i == pos) ? rgb_s(255,255,255) : 0;
                show(pio, sm, buf, LED_COUNT);
                sleep_ms(300);
            }
        }

        // Rainbow
        const uint32_t wheel[6] = {
            rgb_s(255,0,0), rgb_s(255,127,0), rgb_s(255,255,0),
            rgb_s(0,255,0), rgb_s(0,0,255),   rgb_s(75,0,130),
        };
        for (int c = 0; c < 8; c++) {
            for (int off = 0; off < 6; off++) {
                for (int i = 0; i < LED_COUNT; i++)
                    buf[i] = wheel[(i + off) % 6];
                show(pio, sm, buf, LED_COUNT);
                sleep_ms(300);
            }
        }
    }
}
