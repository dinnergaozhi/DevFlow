import { ElMessage } from 'element-plus/es/components/message/index'
import { ElMessageBox } from 'element-plus/es/components/message-box/index'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

/** 统一的消息提示，避免每个组件重复 import element-plus 的样式 */
export const toast = {
  success(message: string): void {
    ElMessage({ message, type: 'success', duration: 2000 })
  },
  error(message: string): void {
    ElMessage({ message, type: 'error', duration: 2600 })
  },
  info(message: string): void {
    ElMessage({ message, type: 'info', duration: 2000 })
  },
  warning(message: string): void {
    ElMessage({ message, type: 'warning', duration: 2200 })
  },
}

export async function confirmAction(message: string, title = '提示', confirmText = '确定'): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: '取消',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}
