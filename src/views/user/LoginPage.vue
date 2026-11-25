<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/feedback'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function fillDemo(): void {
  form.username = 'user_0001'
  form.password = 'pass1'
}

async function onSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const user = await userStore.login({ username: form.username.trim(), password: form.password })
    toast.success(`欢迎回来，${user.nickname || user.username}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth card">
    <section class="auth__brand">
      <div class="auth__glow" />
      <p class="auth__eyebrow">AI 掘金头条</p>
      <h1 class="auth__headline">把碎片时间<br />换成硬核技术。</h1>
      <p class="auth__sub">聚合 69 个技术标签、120 位作者的工程实践，登录后收藏与足迹会一直为你留着。</p>

      <ul class="auth__features">
        <li>
          <span class="dot" />
          信息流按标签 / 分类 / 热度多维筛选
        </li>
        <li>
          <span class="dot" />
          收藏与浏览足迹跨设备同步
        </li>
        <li>
          <span class="dot" />
          Markdown 渲染 + 目录锚点，长文也好读
        </li>
      </ul>

      <div class="auth__demo">
        <div>
          <strong>体验账号</strong>
          <p>user_0001 / pass1</p>
        </div>
        <button type="button" @click="fillDemo">一键填入</button>
      </div>
    </section>

    <section class="auth__form">
      <header class="auth__form-head">
        <h2>欢迎回来</h2>
        <p>登录后继续你的阅读</p>
      </header>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-button class="auth__submit" type="primary" :loading="loading" @click="onSubmit">登录</el-button>
      </el-form>

      <p class="auth__switch">
        还没有账号？
        <RouterLink :to="{ path: '/register', query: route.query }">立即注册</RouterLink>
      </p>
      <p class="auth__agreement">登录即表示同意本站的使用条款与隐私政策（演示项目，仅供学习）。</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.auth {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  width: min(940px, 100%);
  min-height: 540px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: 0 30px 80px rgba(23, 55, 120, 0.14);
}

.auth__brand {
  position: relative;
  padding: 44px 40px;
  background: linear-gradient(150deg, #16307a 0%, #2253cc 48%, #3f7bff 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.auth__glow {
  position: absolute;
  width: 340px;
  height: 340px;
  right: -120px;
  top: -120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  filter: blur(6px);
}

.auth__eyebrow {
  position: relative;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.75;
}

.auth__headline {
  position: relative;
  margin-top: 16px;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.5px;
}

.auth__sub {
  position: relative;
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
}

.auth__features {
  position: relative;
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #7dfcc0;
    flex: none;
  }
}

.auth__demo {
  position: relative;
  margin-top: auto;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);

  strong {
    font-size: 12.5px;
    font-weight: 700;
  }

  p {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);
    font-family: Consolas, monospace;
  }

  button {
    flex: none;
    height: 30px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.18s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.24);
    }
  }
}

.auth__form {
  padding: 52px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #fff;

  &-head {
    margin-bottom: 26px;

    h2 {
      font-size: 24px;
      font-weight: 800;
    }

    p {
      margin-top: 6px;
      font-size: 13px;
      color: var(--c-text-3);
    }
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 600;
    color: var(--c-text-2);
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    background: #f7f9fd;
    box-shadow: 0 0 0 1px transparent;

    &.is-focus {
      background: #fff;
      box-shadow: 0 0 0 1px var(--c-primary);
    }
  }
}

.auth__submit {
  width: 100%;
  height: 44px;
  margin-top: 6px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #4d86ff, #2b6cff);
  border: 0;
  box-shadow: 0 10px 24px rgba(43, 108, 255, 0.26);
}

.auth__switch {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--c-text-3);

  a {
    color: var(--c-primary);
    font-weight: 600;
  }
}

.auth__agreement {
  margin-top: 10px;
  text-align: center;
  font-size: 11.5px;
  color: #a9b2c4;
}

@media (max-width: 860px) {
  .auth {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .auth__brand {
    padding: 30px 26px 34px;

    &__headline {
      font-size: 26px;
    }
  }

  .auth__headline {
    font-size: 26px;
  }

  .auth__features,
  .auth__demo {
    display: none;
  }

  .auth__form {
    padding: 32px 26px 38px;
  }
}
</style>
