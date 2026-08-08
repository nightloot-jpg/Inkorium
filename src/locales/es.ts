export const es = {
  auth: {
    login: {
      title: 'Bienvenido de nuevo',
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidó su contraseña?',
      submit: 'Iniciar sesión',
      noAccount: '¿No tiene cuenta?',
      signUpLink: 'Regístrese',
    },
    register: {
      title: 'Crear cuenta',
      usernameLabel: 'Nombre de usuario',
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      confirmPasswordLabel: 'Confirmar contraseña',
      submit: 'Crear cuenta',
      hasAccount: '¿Ya tiene una cuenta?',
      signInLink: 'Iniciar sesión',
      success: {
        title: '✓ Cuenta creada correctamente',
        message: 'Te hemos enviado un correo de verificación.\nDebes confirmar tu dirección de correo antes de iniciar sesión.',
        backToLogin: 'Ir al inicio de sesión'
      }
    },
    forgotPassword: {
      title: 'Recuperar contraseña',
      description: 'Introduce el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.',
      emailLabel: 'Email',
      submit: 'Enviar enlace de recuperación',
      backToLogin: '← Volver al inicio de sesión',
      success: {
        title: 'Revisa tu correo',
        message: 'Hemos enviado un enlace para restablecer tu contraseña.\nSi existe una cuenta asociada a ese correo, recibirás un email con las instrucciones.',
      },
      errors: {
        sendFailed: 'No se ha podido enviar el correo.',
        unexpected: 'Ha ocurrido un error inesperado.',
      }
    },
    updatePassword: {
      title: 'Actualizar contraseña',
      description: 'Introduce tu nueva contraseña.',
      newPasswordLabel: 'Nueva contraseña',
      confirmPasswordLabel: 'Confirmar contraseña',
      submit: 'Actualizar contraseña',
      success: {
        title: '✓ Contraseña actualizada',
        message: 'Tu contraseña se ha actualizado correctamente.',
        backToLogin: 'Ir al inicio de sesión'
      }
    },
    validation: {
      emailRequired: 'El email es obligatorio',
      emailInvalid: 'Por favor, introduzca un email válido',
      passwordRequired: 'La contraseña es obligatoria',
      passwordMin: 'La contraseña debe tener al menos 8 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      usernameRequired: 'El nombre de usuario es obligatorio',
    },
    errors: {
      default: 'Ha ocurrido un error inesperado',
    }
  }
};
