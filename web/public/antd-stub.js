/**
 * antd 最小 stub：antd 未安装，但 @lobehub/icons / antd-style 间接依赖它。
 * 仅用于确保 dev server 和构建能正常解析模块，不提供实际 antd 功能。
 */
import { createElement, Fragment } from 'react';

const noop = () => null;
const Comp = (props) =>
  props && props.children ? createElement(Fragment, null, props.children) : null;
Comp.Group = Comp;
Comp.Item = Comp;
Comp.Option = Comp;

export const theme = {
  useToken: () => ({ token: {}, hashId: '' }),
  defaultAlgorithm: 'default',
  darkAlgorithm: 'dark',
  compactAlgorithm: 'compact',
  getDesignToken: () => ({}),
};

export const version = '5.0.0';
export const App = Comp;
export const ConfigProvider = Comp;
export const Grid = { useBreakpoint: () => ({}) };
export const message = { success: noop, error: noop, warning: noop, info: noop, loading: noop };
export const Modal = Object.assign(noop, {
  confirm: noop, info: noop, success: noop, error: noop, warning: noop,
});
export const notification = { success: noop, error: noop, warning: noop, info: noop };
export const DatePicker = Comp;
export const Slider = Comp;
export const Form = Object.assign(Comp, { Item: Comp, useForm: () => [{}] });
export const Skeleton = Comp;
export const AutoComplete = Comp;
export const Drawer = Comp;
export const Menu = Object.assign(Comp, { Item: Comp, SubMenu: Comp });
export const Empty = Comp;
export const Button = Comp;
export const Tag = Comp;
export const Input = Object.assign(Comp, {
  Password: Comp, TextArea: Comp, Group: Comp, Search: Comp, OTP: Comp,
});
export const Anchor = Comp;
export const Image = Object.assign(Comp, { PreviewGroup: Comp });
export const Tabs = Object.assign(Comp, { TabPane: Comp });
export const Segmented = Comp;
export const Select = Object.assign(Comp, { Option: Comp, OptGroup: Comp });
export const Collapse = Object.assign(Comp, { Panel: Comp });
export const Divider = Comp;
export const Avatar = Object.assign(Comp, { Group: Comp });
export const ColorPicker = Comp;
export const InputNumber = Comp;
export const Spin = Comp;
export const Card = Comp;
export const Row = Comp;
export const Col = Comp;
export const Space = Comp;
export const Typography = { Text: Comp, Link: Comp, Title: Comp, Paragraph: Comp };
export const Switch = Comp;
export const Checkbox = Comp;
export const Radio = Object.assign(Comp, { Group: Comp });
export const List = Object.assign(Comp, { Item: Object.assign(Comp, { Meta: Comp }) });
export const Table = Object.assign(Comp, { Column: Comp, ColumnGroup: Comp });
export const Popover = Comp;
export const Tooltip = Comp;
export const Badge = Comp;
export const Progress = Comp;
export const Upload = Comp;
export const TimePicker = Comp;
export const Transfer = Comp;
export const Tree = Comp;
export const TreeSelect = Comp;
export const Pagination = Comp;
export const Breadcrumb = Object.assign(Comp, { Item: Comp });
export const Steps = Object.assign(Comp, { Step: Comp });
export const Alert = Comp;
export const Result = Comp;
export const Dropdown = Comp;
export const Popconfirm = Comp;
export const Rate = Comp;
export const Statistic = Comp;
export const Timeline = Object.assign(Comp, { Item: Comp });

export default {};
