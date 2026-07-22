/** Ant Design 主题定制 - 深海蓝金融投研配色 */
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#163D7A',
    colorSuccess: '#2D995F',
    colorWarning: '#E6772E',
    colorError: '#E6772E',
    colorInfo: '#163D7A',
    colorTextBase: '#333333',
    colorBgBase: '#FFFFFF',
    fontFamily: "PingFang SC, Microsoft YaHei, -apple-system, sans-serif",
    borderRadius: 4,
    colorBorder: '#D9D9D9',
  },
  components: {
    Layout: {
      siderBg: '#163D7A',
      headerBg: '#FFFFFF',
      bodyBg: '#E8EFF9',
    },
    Menu: {
      darkItemBg: '#163D7A',
      darkItemSelectedBg: 'rgba(255,255,255,0.15)',
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
    },
    Table: {
      headerBg: '#E8EFF9',
      rowHoverBg: '#E8EFF9',
    },
  },
};

export default theme;
