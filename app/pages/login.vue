<script setup lang="ts">
definePageMeta({ layout: false });

const { signInEmail, signUpEmail, signInGoogle, isLoggedIn, session, refresh } = useAuth();

const mode = ref<'signin' | 'signup'>('signin');
const email = ref('');
const password = ref('');
const name = ref('');
const error = ref('');

watchEffect(() => {
  if (isLoggedIn.value) navigateTo('/');
});

onMounted(async () => {
  if (session.value === null) {
    await refresh();
  }
});

async function submit() {
  error.value = '';
  try {
    if (mode.value === 'signin') {
      await signInEmail(email.value, password.value);
    } else {
      await signUpEmail(email.value, password.value, name.value);
    }
    await navigateTo('/');
  } catch (e: any) {
    error.value = e?.message ?? 'Something went wrong.';
  }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-paper); font-family: var(--font-ui)">
    <div style="width: 360px; border: 1px solid var(--color-navy); background: #fff; padding: 28px">
      <div style="font: 400 20px 'Archivo Black', sans-serif; letter-spacing: -0.01em; margin-bottom: 4px">
        RANDOM<span style="color: var(--color-orange)">SHIT</span>TRACKER
      </div>
      <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 20px">
        {{ mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT' }}
      </div>

      <form style="display: flex; flex-direction: column; gap: 10px" @submit.prevent="submit">
        <input
          v-if="mode === 'signup'"
          v-model="name"
          placeholder="Name"
          style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper)"
        />
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper)"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper)"
        />
        <button
          type="submit"
          style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 11px; font: 400 12px 'Archivo Black', sans-serif; letter-spacing: 0.08em"
        >
          {{ mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT' }}
        </button>
      </form>

      <button
        type="button"
        style="width: 100%; margin-top: 10px; border: 1px solid var(--color-navy); background: transparent; cursor: pointer; padding: 10px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase"
        @click="signInGoogle"
      >
        Continue with Google
      </button>

      <p v-if="error" style="color: var(--color-rust); font-size: 12.5px; margin-top: 12px">{{ error }}</p>

      <button
        type="button"
        style="border: 0; background: transparent; cursor: pointer; margin-top: 16px; font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: var(--color-rust)"
        @click="mode = mode === 'signin' ? 'signup' : 'signin'"
      >
        {{ mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in' }}
      </button>
    </div>
  </div>
</template>
