/**
 * 图标映射配置
 */
import {
  DataAnalysis,
  Folder,
  DocumentChecked,
  EditPen,
  Setting,
  Search,
  List,
  Document,
  HomeFilled,
  Lightning,
} from '@element-plus/icons-vue'
import { markRaw, type Component } from 'vue'

/**
 * 图标名称到组件的映射
 */
export const iconMap: Record<string, Component> = {
  DataAnalysis: markRaw(DataAnalysis),
  Folder: markRaw(Folder),
  DocumentChecked: markRaw(DocumentChecked),
  EditPen: markRaw(EditPen),
  Setting: markRaw(Setting),
  Search: markRaw(Search),
  List: markRaw(List),
  Document: markRaw(Document),
  HomeFilled: markRaw(HomeFilled),
  Lightning: markRaw(Lightning),
}

/**
 * 获取图标组件
 */
export function getIcon(iconName?: string): Component {
  if (!iconName) return HomeFilled
  return iconMap[iconName] || HomeFilled
}
