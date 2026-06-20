#include "pico/stdlib.h"

int main()
{
    gpio_init(3);
    gpio_set_dir(3, GPIO_OUT);

    while (true)
    {
        gpio_put(3, 1);
        sleep_ms(500);

        gpio_put(3, 0);
        sleep_ms(500);
    }
}