export interface AppItem {
  appCode: string;
  appId: string;
  appName: string;
  description: string;
}
export interface DataSourceItem extends AppItem {
  uuid: number;
}
export interface ManageSystemProps {
  appList: Array<AppItem>;
  onGetAppList: () => void;
}
export interface BaseConfigModalProps {
  dataSource: Array<DataSourceItem>;
  onOk: (type: 'edit' | 'add', item: DataSourceItem) => void;
}
export interface BaseConfigModalRef {
  show: (item?: DataSourceItem) => void;
}
