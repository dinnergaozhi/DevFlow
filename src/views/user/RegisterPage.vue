<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, Message, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/feedback'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', nickname: '', email: '', password: '', confirm: '' })

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{4,20}$/, message: '4-20 位字母、数字或下划线', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback: (error?: Error) => void) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function onSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const user = await userStore.register({
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim(),
      nickname: form.nickname.trim() || form.username.trim(),
    })
    toast.success(`注册成功，欢迎你，${user.nickname || user.username}`)
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
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
      <p class="auth__eyebrow">Join us</p>
      <h1 class="auth__headline">加入技术阅读者<br />的日常。</h1>
      <p class="auth__sub">注册后可以收藏文章、同步浏览足迹，还能关注喜欢的作者持续追更。</p>

      <ul class="auth__features">
        <li><span class="dot" />收藏夹：把好文章留到周末慢慢读</li>
        <li><span class="dot" />浏览足迹：找回昨天看到一半的那篇</li>
        <li><span class="dot" />作者跟进：关注后新文章第一时间看到</li>
      </ul>
    </section>

    <section class="auth__form">
      <header class="auth__form-head">
        <h2>创建账号</h2>
        <p>30 秒完成，开始你的信息流</p>
      </header>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent>
        <div class="grid-2">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="4-20 位字母 / 数字" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="昵称（选填）" prop="nickname">
            <el-input v-model="form.nickname" placeholder="展示用的名字" />
          </el-form-item>
        </div>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="you@example.com" :prefix-icon="Message" />
        </el-form-item>

        <div class="grid-2">
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="至少 6 位" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirm">
            <el-input v-model="form.confirm" type="password" placeholder="再输入一次" :prefix-icon="Lock" show-password />
          </el-form-item>
        </div>

        <el-button class="auth__submit" type="primary" :loading="loading" @click="onSubmit">注册并登录</el-button>
      </el-form>

      <p class="auth__switch">
        已有账号？
        <RouterLink :to="{ path: '/login', query: route.query }">返回登录</RouterLink>
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.auth {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  width: min(980px, 100%);
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: 0 30px 80px rgba(23, 55, 120, 0.14);
}

.auth__brand {
  position: relative;
  padding: 44px 40px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(150deg, #0f2a63 0%, #1e4fb8 52%, #3d78f5 100%);
  color: #fff;
  overflow: hidden;
}

.auth__glow {
  position: absolute;
  width: 320px;
  height: 320px;
  left: -120px;
  bottom: -140px;
  border-radius: 50%;
  background: rgba(125, 252, 192, 0.18);
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
  font-size: 30px;
  font-weight: 800;
  line-height: 1.4;
}

.auth__sub {
  position: relative;
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
}

.auth__features {
  position: relative;
  margin-top: auto;
  padding-top: 30px;
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

.auth__form {
  padding: 44px 40px;
  background: #fff;

  &-head {
    margin-bottom: 22px;

    h2 {
      font-size: 23px;
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

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

.auth__submit {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #4d86ff, #2b6cff);
  border: 0;
  box-shadow: 0 10px 24px rgba(43, 108, 255, 0.26);
}

.auth__switch {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--c-text-3);

  a {
    color: var(--c-primary);
    font-weight: 600;
  }
}

@media (max-width: 880px) {
  .auth {
    grid-template-columns: 1fr;
  }

  .auth__brand {
    padding: 28px 26px;

    &__features {
      display: none;
    }
  }

  .auth__headline {
    font-size: 24px;
  }

  .auth__features {
    display: none;
  }

  .auth__form {
    padding: 28px 24px 34px;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
