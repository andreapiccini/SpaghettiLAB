#include "dial_ui.h"
#include "display_port.h"
#include <Arduino.h>
#include <lvgl.h>
#include <math.h>

namespace {
constexpr int S=466,C=233,N=64; constexpr float R2D=57.2957795f;
lv_obj_t *ticks[N]={},*marker=nullptr,*position=nullptr;
lv_obj_t *min_stop=nullptr,*max_stop=nullptr,*force=nullptr;
lv_point_t tick_pts[N][2]={}; int tick_count=0; int32_t min_pos=0,max_pos=23;
float step_rad=2*PI/24;
lv_color_t col(uint32_t c){return lv_color_hex(c);}
void clear_box(lv_obj_t *o){lv_obj_set_style_bg_opa(o,LV_OPA_TRANSP,0);lv_obj_set_style_border_width(o,0,0);lv_obj_set_style_pad_all(o,0,0);}
int angle360(float deg){int a=lroundf(deg)%360;return a<0?a+360:a;}
// Match the desktop preview exactly: min is at twelve o'clock and every
// logical position advances counter-clockwise by one fraction of the range.
float dial_angle(float logical){
 const int count=max(1,tick_count);
 return -((logical-min_pos)/(float)count)*360.0f-90.0f;
}
void stop_angle(lv_obj_t *o,float deg){int a=angle360(deg);lv_arc_set_bg_angles(o,angle360(a-4),angle360(a+4));}
void rebuild(int count){
 count=constrain(count,1,N);tick_count=count;
 for(int i=0;i<N;i++){
  if(i>=count){lv_obj_add_flag(ticks[i],LV_OBJ_FLAG_HIDDEN);continue;}
  lv_obj_clear_flag(ticks[i],LV_OBJ_FLAG_HIDDEN);
  float a=-PI/2+2*PI*i/count;int inner=i%4==0?181:188,outer=203;
  tick_pts[i][0]={(lv_coord_t)(C+cosf(a)*inner),(lv_coord_t)(C+sinf(a)*inner)};
  tick_pts[i][1]={(lv_coord_t)(C+cosf(a)*outer),(lv_coord_t)(C+sinf(a)*outer)};
  lv_line_set_points(ticks[i],tick_pts[i],2);
  lv_obj_set_style_line_color(ticks[i],lv_color_hsv_to_rgb((uint16_t)(i*360/count),92,100),0);
 }
}
lv_obj_t *make_stop(lv_obj_t *parent){
 auto *o=lv_arc_create(parent);lv_obj_set_size(o,390,390);lv_obj_center(o);
 lv_obj_remove_style(o,nullptr,LV_PART_KNOB);lv_obj_clear_flag(o,LV_OBJ_FLAG_CLICKABLE);
 lv_obj_set_style_arc_width(o,8,LV_PART_MAIN);lv_obj_set_style_arc_color(o,col(0xFFC064),LV_PART_MAIN);
 lv_obj_set_style_arc_opa(o,LV_OPA_TRANSP,LV_PART_INDICATOR);return o;
}
}
bool dial_ui_create(){
 if(!highside_display_lock())return false;auto *scr=lv_scr_act();
 lv_obj_set_style_bg_color(scr,col(0x000000),0);lv_obj_set_style_bg_opa(scr,LV_OPA_COVER,0);lv_obj_clear_flag(scr,LV_OBJ_FLAG_SCROLLABLE);
 auto *ring=lv_obj_create(scr);lv_obj_set_size(ring,426,426);lv_obj_center(ring);clear_box(ring);
 lv_obj_set_style_radius(ring,LV_RADIUS_CIRCLE,0);lv_obj_set_style_border_width(ring,1,0);
 lv_obj_set_style_border_color(ring,col(0x151515),0);
 for(int i=0;i<N;i++){ticks[i]=lv_line_create(scr);clear_box(ticks[i]);lv_obj_set_size(ticks[i],S,S);lv_obj_align(ticks[i],LV_ALIGN_TOP_LEFT,0,0);
  lv_obj_set_style_line_width(ticks[i],i%4==0?4:3,0);lv_obj_set_style_line_rounded(ticks[i],true,0);
  lv_obj_set_style_line_opa(ticks[i],i%4==0?LV_OPA_COVER:LV_OPA_80,0);}
 rebuild(24);
 min_stop=make_stop(scr);max_stop=make_stop(scr);force=make_stop(scr);lv_obj_add_flag(force,LV_OBJ_FLAG_HIDDEN);
 marker=lv_obj_create(scr);lv_obj_set_size(marker,18,18);lv_obj_set_style_radius(marker,LV_RADIUS_CIRCLE,0);
 lv_obj_set_style_bg_color(marker,col(0x73C8FF),0);lv_obj_set_style_border_width(marker,3,0);lv_obj_set_style_border_color(marker,col(0xD6F1FF),0);
 lv_obj_set_style_shadow_width(marker,18,0);lv_obj_set_style_shadow_color(marker,col(0x278FFF),0);
 position=lv_label_create(scr);lv_label_set_text(position,"0");lv_obj_set_style_text_color(position,col(0xEAF7FF),0);
 lv_obj_set_style_text_font(position,&lv_font_montserrat_48,0);lv_obj_center(position);
 highside_display_unlock();return true;
}
void dial_ui_set_state(const SenseDial_LowSide_DialState &s){
 if(!highside_display_lock(20))return;
 if(s.has_config){min_pos=s.config.min_position;max_pos=s.config.max_position;if(s.config.position_width_radians>.001f)step_rad=s.config.position_width_radians;
  int count=max(1L,(long)(max_pos-min_pos+1));if(count!=tick_count)rebuild(count);}
 float logical=s.current_position+s.sub_position_unit,deg=dial_angle(logical),rad=deg/R2D;
 lv_obj_set_pos(marker,C+(int)(cosf(rad)*145)-9,C+(int)(sinf(rad)*145)-9);
 char text[20];snprintf(text,sizeof(text),"%ld",(long)s.current_position);lv_label_set_text(position,text);lv_obj_center(position);
 stop_angle(min_stop,dial_angle(min_pos));stop_angle(max_stop,dial_angle(max_pos));
 float over=logical<min_pos?min_pos-logical:(logical>max_pos?logical-max_pos:0);
 if(over>0.001f){float degrees=min(359.0f,(over/max(1,tick_count))*360.0f),stop=dial_angle(logical<min_pos?min_pos:max_pos);
  int start=logical<min_pos?angle360(stop):angle360(stop-degrees);
  int end=logical<min_pos?angle360(stop+degrees):angle360(stop);
  lv_obj_clear_flag(force,LV_OBJ_FLAG_HIDDEN);lv_arc_set_bg_angles(force,start,end);
  lv_obj_set_style_arc_width(force,(int)(4+min(1.0f,degrees/360)*18),LV_PART_MAIN);
  for(int i=0;i<tick_count;i++)lv_obj_set_style_line_opa(ticks[i],LV_OPA_20,0);
 }else{lv_obj_add_flag(force,LV_OBJ_FLAG_HIDDEN);for(int i=0;i<tick_count;i++)lv_obj_set_style_line_opa(ticks[i],i%4==0?LV_OPA_COVER:LV_OPA_80,0);}
 highside_display_unlock();
}
void dial_ui_set_status(const SenseDial_LowSide_LowSideStatus &s){
 if(!highside_display_lock(20))return;
 lv_obj_set_style_text_color(position,col(s.fault_active?0xFF6060:s.ready?0xFFFFFF:0xFFC064),0);
 highside_display_unlock();
}
void dial_ui_set_connected(bool){}
