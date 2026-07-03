/** Preset gray SVG icons for prompt groups (Lucide stroke paths). */

export interface GroupIconNode {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon';
  attrs: Record<string, string>;
}

export interface GroupIconConfig {
  id: string;
  /** i18n key for aria-label in group manager. */
  labelKey: string;
  nodes: GroupIconNode[];
}

export const DEFAULT_GROUP_ICON_ID = 'folder';
export const UNGROUPED_GROUP_ICON_ID = 'inbox';

/** viewBox 0 0 24 24 — tinted via CSS currentColor. */
export const PROMPT_GROUP_ICONS: GroupIconConfig[] = [
  {
    id: 'label',
    labelKey: 'pm_tag_icon_label',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "7.5",
                      "cy": "7.5",
                      "r": ".5",
                      "fill": "currentColor"
                }
          }
    ],
  },
  {
    id: 'folder',
    labelKey: 'pm_tag_icon_folder',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
                }
          }
    ],
  },
  {
    id: 'inbox',
    labelKey: 'pm_group_icon_inbox',
    nodes: [
          {
                "tag": "polyline",
                "attrs": {
                      "points": "22 12 16 12 14 15 10 15 8 12 2 12"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
                }
          }
    ],
  },
  {
    id: 'bolt',
    labelKey: 'pm_tag_icon_bolt',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                }
          }
    ],
  },
  {
    id: 'edit',
    labelKey: 'pm_tag_icon_edit',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
                }
          }
    ],
  },
  {
    id: 'image',
    labelKey: 'pm_tag_icon_image',
    nodes: [
          {
                "tag": "rect",
                "attrs": {
                      "width": "18",
                      "height": "18",
                      "x": "3",
                      "y": "3",
                      "rx": "2",
                      "ry": "2"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "9",
                      "cy": "9",
                      "r": "2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
                }
          }
    ],
  },
  {
    id: 'camera',
    labelKey: 'pm_tag_icon_camera',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "13",
                      "r": "3"
                }
          }
    ],
  },
  {
    id: 'brush',
    labelKey: 'pm_tag_icon_brush',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m11 10 3 3"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"
                }
          }
    ],
  },
  {
    id: 'palette',
    labelKey: 'pm_tag_icon_palette',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "13.5",
                      "cy": "6.5",
                      "r": ".5",
                      "fill": "currentColor"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "17.5",
                      "cy": "10.5",
                      "r": ".5",
                      "fill": "currentColor"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "6.5",
                      "cy": "12.5",
                      "r": ".5",
                      "fill": "currentColor"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "8.5",
                      "cy": "7.5",
                      "r": ".5",
                      "fill": "currentColor"
                }
          }
    ],
  },
  {
    id: 'star',
    labelKey: 'pm_tag_icon_star',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                }
          }
    ],
  },
  {
    id: 'code',
    labelKey: 'pm_tag_icon_code',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m16 18 6-6-6-6"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m8 6-6 6 6 6"
                }
          }
    ],
  },
  {
    id: 'terminal',
    labelKey: 'pm_group_icon_terminal',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 19h8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m4 17 6-6-6-6"
                }
          }
    ],
  },
  {
    id: 'translate',
    labelKey: 'pm_tag_icon_translate',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m5 8 6 6"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m4 14 6-6 2-3"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 5h12"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M7 2h1"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m22 22-5-10-5 10"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M14 18h6"
                }
          }
    ],
  },
  {
    id: 'language',
    labelKey: 'pm_group_icon_language',
    nodes: [
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "12",
                      "r": "10"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 12h20"
                }
          }
    ],
  },
  {
    id: 'search',
    labelKey: 'pm_tag_icon_search',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m21 21-4.34-4.34"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "11",
                      "cy": "11",
                      "r": "8"
                }
          }
    ],
  },
  {
    id: 'article',
    labelKey: 'pm_tag_icon_article',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M14 2v5a1 1 0 0 0 1 1h5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M10 9H8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 13H8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 17H8"
                }
          }
    ],
  },
  {
    id: 'description',
    labelKey: 'pm_group_icon_description',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M14 2v5a1 1 0 0 0 1 1h5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M10 9H8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 13H8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 17H8"
                }
          }
    ],
  },
  {
    id: 'note',
    labelKey: 'pm_group_icon_note',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M15 3v5a1 1 0 0 0 1 1h5"
                }
          }
    ],
  },
  {
    id: 'psychology',
    labelKey: 'pm_tag_icon_psychology',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 18V5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M17.997 5.125a4 4 0 0 1 2.526 5.77"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M18 18a4 4 0 0 0 2-7.464"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M6 18a4 4 0 0 1-2-7.464"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M6.003 5.125a4 4 0 0 0-2.526 5.77"
                }
          }
    ],
  },
  {
    id: 'lightbulb',
    labelKey: 'pm_group_icon_lightbulb',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M9 18h6"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M10 22h4"
                }
          }
    ],
  },
  {
    id: 'work',
    labelKey: 'pm_tag_icon_work',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "20",
                      "height": "14",
                      "x": "2",
                      "y": "6",
                      "rx": "2"
                }
          }
    ],
  },
  {
    id: 'school',
    labelKey: 'pm_group_icon_school',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M22 10v6"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M6 12.5V16a6 3 0 0 0 12 0v-3.5"
                }
          }
    ],
  },
  {
    id: 'science',
    labelKey: 'pm_group_icon_science',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M6.453 15h11.094"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M8.5 2h7"
                }
          }
    ],
  },
  {
    id: 'build',
    labelKey: 'pm_group_icon_build',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
                }
          }
    ],
  },
  {
    id: 'handyman',
    labelKey: 'pm_group_icon_handyman',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m18 15 4-4"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"
                }
          }
    ],
  },
  {
    id: 'chat',
    labelKey: 'pm_group_icon_chat',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
                }
          }
    ],
  },
  {
    id: 'mail',
    labelKey: 'pm_group_icon_mail',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "x": "2",
                      "y": "4",
                      "width": "20",
                      "height": "16",
                      "rx": "2"
                }
          }
    ],
  },
  {
    id: 'link',
    labelKey: 'pm_group_icon_link',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                }
          }
    ],
  },
  {
    id: 'settings',
    labelKey: 'pm_group_icon_settings',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "12",
                      "r": "3"
                }
          }
    ],
  },
  {
    id: 'person',
    labelKey: 'pm_group_icon_person',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "7",
                      "r": "4"
                }
          }
    ],
  },
  {
    id: 'groups',
    labelKey: 'pm_group_icon_groups',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 3.128a4 4 0 0 1 0 7.744"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M22 21v-2a4 4 0 0 0-3-3.87"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "9",
                      "cy": "7",
                      "r": "4"
                }
          }
    ],
  },
  {
    id: 'home',
    labelKey: 'pm_group_icon_home',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                }
          }
    ],
  },
  {
    id: 'menu_book',
    labelKey: 'pm_group_icon_menu_book',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 7v14"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
                }
          }
    ],
  },
  {
    id: 'category',
    labelKey: 'pm_group_icon_category',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "x": "3",
                      "y": "14",
                      "width": "7",
                      "height": "7",
                      "rx": "1"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "17.5",
                      "cy": "17.5",
                      "r": "3.5"
                }
          }
    ],
  },
  {
    id: 'layers',
    labelKey: 'pm_group_icon_layers',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"
                }
          }
    ],
  },
  {
    id: 'grid_view',
    labelKey: 'pm_group_icon_grid_view',
    nodes: [
          {
                "tag": "rect",
                "attrs": {
                      "width": "7",
                      "height": "7",
                      "x": "3",
                      "y": "3",
                      "rx": "1"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "7",
                      "height": "7",
                      "x": "14",
                      "y": "3",
                      "rx": "1"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "7",
                      "height": "7",
                      "x": "14",
                      "y": "14",
                      "rx": "1"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "7",
                      "height": "7",
                      "x": "3",
                      "y": "14",
                      "rx": "1"
                }
          }
    ],
  },
  {
    id: 'list',
    labelKey: 'pm_group_icon_list',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 5h.01"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 12h.01"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 19h.01"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M8 5h13"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M8 12h13"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M8 19h13"
                }
          }
    ],
  },
  {
    id: 'cloud',
    labelKey: 'pm_group_icon_cloud',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
                }
          }
    ],
  },
  {
    id: 'lock',
    labelKey: 'pm_group_icon_lock',
    nodes: [
          {
                "tag": "rect",
                "attrs": {
                      "width": "18",
                      "height": "11",
                      "x": "3",
                      "y": "11",
                      "rx": "2",
                      "ry": "2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M7 11V7a5 5 0 0 1 10 0v4"
                }
          }
    ],
  },
  {
    id: 'favorite',
    labelKey: 'pm_group_icon_favorite',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
                }
          }
    ],
  },
  {
    id: 'flag',
    labelKey: 'pm_group_icon_flag',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
                }
          }
    ],
  },
  {
    id: 'schedule',
    labelKey: 'pm_group_icon_schedule',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 6v6l4 2"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "12",
                      "r": "10"
                }
          }
    ],
  },
  {
    id: 'calendar_today',
    labelKey: 'pm_group_icon_calendar',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M8 2v4"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M16 2v4"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "18",
                      "height": "18",
                      "x": "3",
                      "y": "4",
                      "rx": "2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 10h18"
                }
          }
    ],
  },
  {
    id: 'attach_file',
    labelKey: 'pm_group_icon_attach',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"
                }
          }
    ],
  },
  {
    id: 'download',
    labelKey: 'pm_group_icon_download',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 15V3"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m7 10 5 5 5-5"
                }
          }
    ],
  },
  {
    id: 'upload',
    labelKey: 'pm_group_icon_upload',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 3v12"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "m17 8-5-5-5 5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                }
          }
    ],
  },
  {
    id: 'refresh',
    labelKey: 'pm_group_icon_refresh',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 3v5h-5"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M8 16H3v5"
                }
          }
    ],
  },
  {
    id: 'auto_awesome',
    labelKey: 'pm_group_icon_auto_awesome',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M20 2v4"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M22 4h-4"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "4",
                      "cy": "20",
                      "r": "2"
                }
          }
    ],
  },
  {
    id: 'smart_toy',
    labelKey: 'pm_group_icon_smart_toy',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 8V4H8"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "width": "16",
                      "height": "12",
                      "x": "4",
                      "y": "8",
                      "rx": "2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2 14h2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M20 14h2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M15 13v2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M9 13v2"
                }
          }
    ],
  },
  {
    id: 'public',
    labelKey: 'pm_group_icon_public',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M21.54 15H17a2 2 0 0 0-2 2v4.54"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "12",
                      "cy": "12",
                      "r": "10"
                }
          }
    ],
  },
  {
    id: 'restaurant',
    labelKey: 'pm_group_icon_restaurant',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M7 2v20"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
                }
          }
    ],
  },
  {
    id: 'shopping_cart',
    labelKey: 'pm_group_icon_shopping_cart',
    nodes: [
          {
                "tag": "circle",
                "attrs": {
                      "cx": "8",
                      "cy": "21",
                      "r": "1"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "19",
                      "cy": "21",
                      "r": "1"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
                }
          }
    ],
  },
  {
    id: 'music_note',
    labelKey: 'pm_group_icon_music',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M9 18V5l12-2v13"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "6",
                      "cy": "18",
                      "r": "3"
                }
          },
          {
                "tag": "circle",
                "attrs": {
                      "cx": "18",
                      "cy": "16",
                      "r": "3"
                }
          }
    ],
  },
  {
    id: 'videocam',
    labelKey: 'pm_group_icon_videocam',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "x": "2",
                      "y": "6",
                      "width": "14",
                      "height": "12",
                      "rx": "2"
                }
          }
    ],
  },
  {
    id: 'mic',
    labelKey: 'pm_group_icon_mic',
    nodes: [
          {
                "tag": "path",
                "attrs": {
                      "d": "M12 19v3"
                }
          },
          {
                "tag": "path",
                "attrs": {
                      "d": "M19 10v2a7 7 0 0 1-14 0v-2"
                }
          },
          {
                "tag": "rect",
                "attrs": {
                      "x": "9",
                      "y": "2",
                      "width": "6",
                      "height": "13",
                      "rx": "3"
                }
          }
    ],
  }];

export function getGroupIconConfig(iconId: string | undefined | null): GroupIconConfig {
  const id = iconId?.trim() || DEFAULT_GROUP_ICON_ID;
  return PROMPT_GROUP_ICONS.find((i) => i.id === id) ?? PROMPT_GROUP_ICONS[0]!;
}

export function resolveGroupIconId(group: { iconId?: string | null } | null | undefined): string {
  if (!group) return UNGROUPED_GROUP_ICON_ID;
  return group.iconId?.trim() || DEFAULT_GROUP_ICON_ID;
}

function renderIconNode({ tag, attrs }: GroupIconNode): string {
  const parts = Object.entries(attrs)
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ');
  return `<${tag} ${parts}/>`;
}

export function createGroupIconElement(
  iconId: string,
  className = 'gv-pm-group-icon',
  size = 16,
): HTMLElement {
  const config = getGroupIconConfig(iconId);
  const body = config.nodes.map(renderIconNode).join('');
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return span;
}
