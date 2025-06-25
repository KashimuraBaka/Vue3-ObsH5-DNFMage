export interface DanmakuResponse {
  cmd: string;
  data: unknown;
}

export interface DanmakuMessage {
  dm_type: number
  timestamp: number
  uid: number
  uname: string
  uface: string
  uface_data: string
  guard_level: number
  msg_id: string
  msg: string
  room_id: number
  emoji_img_url: string
  emoji_img_data: string
  fans_medal_level: number
  fans_medal_name: string
  fans_medal_wearing_status: boolean
  union_id: string
  open_id: string
  is_admin: number
  glory_level: number
  reply_union_id: string
  reply_open_id: string
  reply_uname: string
}

export interface GiftComboInfo {
  combo_base_num: number
  combo_count: number
  combo_id: string
  combo_timeout: number
}

export interface BlindGiftInfo {
  status: boolean
  blind_gift_id: number
}

export interface AnchorInfo {
  uface: string
  uid: number
  uname: string
  union_id: string
  open_id: string
}

export interface GiftMessage {
  uid: number
  uname: string
  uface: string
  gift_id: number
  gift_name: string
  gift_num: number
  price: number
  paid: boolean
  fans_medal_level: number
  fans_medal_name: string
  fans_medal_wearing_status: boolean
  guard_level: number
  timestamp: number
  anchor_info: AnchorInfo
  gift_icon: string
  combo_gift: boolean
  combo_info: GiftComboInfo
  union_id: string
  open_id: string
  r_price: number
  blind_gift: BlindGiftInfo
  msg_id: string
  room_id: number
}
