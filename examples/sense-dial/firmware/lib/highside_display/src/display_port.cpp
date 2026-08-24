#include "display_port.h"
#include <Arduino.h>
#include <lvgl.h>
#include "driver/spi_master.h"
#include "esp_heap_caps.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_ops.h"
#include "esp_timer.h"
#include "esp_lcd_sh8601.h"
#include "read_lcd_id_bsp.h"

namespace {
constexpr int W=466,H=466,LINES=40,CS=9,CLK=10,D0=11,D1=12,D2=13,D3=14,RST=21;
constexpr uint8_t SH8601_ID=0x86;
SemaphoreHandle_t mutex_handle=nullptr;
esp_lcd_panel_handle_t panel=nullptr;
lv_disp_drv_t driver;
uint8_t panel_id=0;
const uint8_t sh44[]={0x01,0xD1}, zero[]={0x00}, dim[]={0x20}, full[]={0xFF};
const uint8_t co_c4[]={0x80};
const sh8601_lcd_init_cmd_t sh_init[]={
 {0x11,nullptr,0,120},{0x44,sh44,2,0},{0x35,zero,1,0},{0x53,dim,1,10},
 {0x51,zero,1,10},{0x29,nullptr,0,10},{0x51,full,1,0}};
const sh8601_lcd_init_cmd_t co_init[]={
 {0x11,nullptr,0,80},{0xC4,co_c4,1,0},{0x53,dim,1,1},{0x63,full,1,1},
 {0x51,zero,1,1},{0x29,nullptr,0,10},{0x51,full,1,0}};

bool flush_done(esp_lcd_panel_io_handle_t,esp_lcd_panel_io_event_data_t*,void *ctx){
 lv_disp_flush_ready(static_cast<lv_disp_drv_t*>(ctx)); return false;
}
void flush(lv_disp_drv_t *drv,const lv_area_t *a,lv_color_t *pixels){
 const int gap=panel_id==SH8601_ID?0:6;
 esp_lcd_panel_draw_bitmap(static_cast<esp_lcd_panel_handle_t>(drv->user_data),
  a->x1+gap,a->y1,a->x2+1+gap,a->y2+1,pixels);
}
void round_area(lv_disp_drv_t*,lv_area_t *a){a->x1&=~1;a->y1&=~1;a->x2|=1;a->y2|=1;}
void tick(void*){lv_tick_inc(2);}
void task(void*){
 for(;;){uint32_t ms=5;if(highside_display_lock()){ms=lv_timer_handler();highside_display_unlock();}
 ms=constrain(ms,1u,20u);vTaskDelay(pdMS_TO_TICKS(ms));}
}
}
bool highside_display_lock(unsigned ms){
 return mutex_handle&&xSemaphoreTake(mutex_handle,pdMS_TO_TICKS(ms))==pdTRUE;
}
void highside_display_unlock(){if(mutex_handle)xSemaphoreGive(mutex_handle);}
bool highside_display_init(){
 panel_id=read_lcd_id();
 spi_bus_config_t bus={};
 bus.data0_io_num=D0;bus.data1_io_num=D1;bus.sclk_io_num=CLK;
 bus.data2_io_num=D2;bus.data3_io_num=D3;bus.max_transfer_sz=W*LINES*2;
 if(spi_bus_initialize(SPI2_HOST,&bus,SPI_DMA_CH_AUTO)!=ESP_OK)return false;
 esp_lcd_panel_io_handle_t io=nullptr;
 esp_lcd_panel_io_spi_config_t io_cfg=SH8601_PANEL_IO_QSPI_CONFIG(CS,flush_done,&driver);
 if(esp_lcd_new_panel_io_spi((esp_lcd_spi_bus_handle_t)SPI2_HOST,&io_cfg,&io)!=ESP_OK)return false;
 sh8601_vendor_config_t vendor={};
 vendor.flags.use_qspi_interface=1;
 vendor.init_cmds=panel_id==SH8601_ID?sh_init:co_init;
 vendor.init_cmds_size=panel_id==SH8601_ID?sizeof(sh_init)/sizeof(sh_init[0]):sizeof(co_init)/sizeof(co_init[0]);
 esp_lcd_panel_dev_config_t cfg={};
 cfg.reset_gpio_num=RST;cfg.rgb_ele_order=LCD_RGB_ELEMENT_ORDER_RGB;
 cfg.bits_per_pixel=16;cfg.vendor_config=&vendor;
 if(esp_lcd_new_panel_sh8601(io,&cfg,&panel)!=ESP_OK)return false;
 if(esp_lcd_panel_reset(panel)!=ESP_OK||esp_lcd_panel_init(panel)!=ESP_OK||
    esp_lcd_panel_disp_on_off(panel,true)!=ESP_OK)return false;
 lv_init();
 static lv_disp_draw_buf_t draw;
 auto *a=(lv_color_t*)heap_caps_malloc(W*LINES*sizeof(lv_color_t),MALLOC_CAP_DMA);
 auto *b=(lv_color_t*)heap_caps_malloc(W*LINES*sizeof(lv_color_t),MALLOC_CAP_DMA);
 if(!a||!b)return false;
 lv_disp_draw_buf_init(&draw,a,b,W*LINES);
 lv_disp_drv_init(&driver);driver.hor_res=W;driver.ver_res=H;driver.flush_cb=flush;
 driver.rounder_cb=round_area;driver.draw_buf=&draw;driver.user_data=panel;
 lv_disp_drv_register(&driver);
 const esp_timer_create_args_t args={.callback=tick,.name="lvgl_tick"};
 esp_timer_handle_t timer=nullptr;
 if(esp_timer_create(&args,&timer)!=ESP_OK||esp_timer_start_periodic(timer,2000)!=ESP_OK)return false;
 mutex_handle=xSemaphoreCreateMutex();if(!mutex_handle)return false;
 xTaskCreatePinnedToCore(task,"lvgl",6144,nullptr,2,nullptr,0);
 return true;
}
