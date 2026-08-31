/**
 * Validation utilities for registration forms and file uploads in Inkorium
 */

export interface FieldValidationResult {
  isValid: boolean;
  message?: string;
}

export interface EmailValidationResult extends FieldValidationResult {
  isAvailable?: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Muy débil' | 'Débil' | 'Media' | 'Fuerte';
  color: string;
  percent: number;
  tips: string[];
}

export interface BirthDateValidationResult extends FieldValidationResult {
  age?: number;
}

export interface ImageValidationOptions {
  maxSizeBytes?: number;
  minSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  message?: string;
  error?: string;
  width?: number;
  height?: number;
  dimensions?: { width: number; height: number };
  sizeFormatted?: string;
  mime?: string;
  fileName?: string;
}

export const MAX_PHOTO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_AVATAR_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/avif'
];

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'];

/**
 * Format bytes into human readable size (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validates a person's first name
 */
export function validateName(name: string): FieldValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, message: 'El nombre es obligatorio.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'El nombre no puede exceder 50 caracteres.' };
  }
  // Check for invalid pure numbers
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, message: 'El nombre no puede consistir únicamente en números.' };
  }
  return { isValid: true };
}

/**
 * Validates a person's last name / surname
 */
export function validateSurname(surname: string): FieldValidationResult {
  const trimmed = surname.trim();
  if (!trimmed) {
    return { isValid: false, message: 'Los apellidos son obligatorios.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: 'Los apellidos deben tener al menos 2 caracteres.' };
  }
  if (trimmed.length > 70) {
    return { isValid: false, message: 'Los apellidos no pueden exceder 70 caracteres.' };
  }
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, message: 'Los apellidos no pueden consistir únicamente en números.' };
  }
  return { isValid: true };
}

/**
 * Validates an email address and checks for duplication
 */
export function validateEmail(
  email: string,
  existingUsers: { email?: string; id?: string }[] = [],
  currentUserId?: string
): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, message: 'El correo electrónico es obligatorio.' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Introduce una dirección de correo válida (ejemplo: usuario@correo.com).' };
  }

  // Check uniqueness against existing users in workspace
  const isTaken = existingUsers.some(
    u => u.email && u.email.toLowerCase() === trimmed && u.id !== currentUserId
  );

  if (isTaken) {
    return {
      isValid: false,
      isAvailable: false,
      message: 'Este correo electrónico ya está registrado en Inkorium.'
    };
  }

  return { isValid: true, isAvailable: true };
}

/**
 * Calculates password strength and provides specific tips
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: 'Muy débil', color: 'bg-gray-300', percent: 0, tips: ['Introduce una contraseña.'] };
  }

  let score = 0;
  const tips: string[] = [];

  if (password.length >= 6) score += 1;
  else tips.push('Usa al menos 6 caracteres.');

  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  else if (password.length >= 6) tips.push('Combina mayúsculas y minúsculas.');

  if (/\d/.test(password)) score += 1;
  else if (password.length >= 6) tips.push('Incluye al menos un número.');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalized score 0 - 4
  const normalizedScore = Math.min(4, Math.max(1, Math.floor((score / 5) * 4)));

  if (password.length < 6) {
    return { score: 1, label: 'Muy débil', color: 'bg-red-500', percent: 20, tips };
  }

  switch (normalizedScore) {
    case 1:
      return { score: 1, label: 'Débil', color: 'bg-red-500', percent: 25, tips };
    case 2:
      return { score: 2, label: 'Media', color: 'bg-amber-500', percent: 50, tips };
    case 3:
      return { score: 3, label: 'Fuerte', color: 'bg-blue-500', percent: 75, tips };
    case 4:
    default:
      return { score: 4, label: 'Fuerte', color: 'bg-emerald-500', percent: 100, tips: ['✓ Contraseña segura'] };
  }
}

/**
 * Validates a password
 */
export function validatePassword(password: string): FieldValidationResult {
  if (!password) {
    return { isValid: false, message: 'La contraseña es obligatoria.' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'La contraseña debe tener un mínimo de 6 caracteres.' };
  }
  return { isValid: true };
}

/**
 * Validates password match
 */
export function validatePasswordConfirmation(password: string, confirmation: string): FieldValidationResult {
  if (!confirmation) {
    return { isValid: false, message: 'Por favor confirma tu contraseña.' };
  }
  if (password !== confirmation) {
    return { isValid: false, message: 'Las contraseñas no coinciden.' };
  }
  return { isValid: true };
}

/**
 * Validates birth date for reasonable age (>= 13 years old, not in future)
 */
export function validateBirthDate(birthDateStr: string): BirthDateValidationResult {
  if (!birthDateStr) {
    return { isValid: false, message: 'La fecha de nacimiento es obligatoria.' };
  }

  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, message: 'Fecha de nacimiento no válida.' };
  }

  const today = new Date();
  if (birthDate > today) {
    return { isValid: false, message: 'La fecha de nacimiento no puede ser en el futuro.' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 13) {
    return {
      isValid: false,
      age,
      message: 'Debes tener al menos 13 años para registrarte en Inkorium.'
    };
  }

  if (age > 110) {
    return {
      isValid: false,
      age,
      message: 'Por favor introduce una fecha de nacimiento válida.'
    };
  }

  return { isValid: true, age };
}

/**
 * Validates an image file before upload (format, size, corrupt check and dimensions)
 */
export async function validateImageFile(
  file: File,
  optionsOrMaxBytes: number | ImageValidationOptions = MAX_PHOTO_SIZE_BYTES
): Promise<FileValidationResult> {
  const options: ImageValidationOptions =
    typeof optionsOrMaxBytes === 'number'
      ? { maxSizeBytes: optionsOrMaxBytes }
      : optionsOrMaxBytes || {};

  const maxSizeBytes = options.maxSizeBytes ?? MAX_PHOTO_SIZE_BYTES;
  const minSizeBytes = options.minSizeBytes ?? 1;
  const sizeFormatted = formatFileSize(file.size);
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  // 1. Check MIME type and extension
  const isValidMime = file.type && ALLOWED_IMAGE_MIMES.includes(file.type.toLowerCase());
  const isValidExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

  if (!isValidMime && !isValidExt && !file.type.startsWith('image/')) {
    const errorMsg = `Formato no admitido (${ext.toUpperCase() || 'desconocido'}). Solo se admiten JPG, PNG, GIF, WEBP o BMP.`;
    return {
      isValid: false,
      message: errorMsg,
      error: errorMsg,
      sizeFormatted,
      fileName: file.name
    };
  }

  // 2. Check File size
  if (file.size > maxSizeBytes) {
    const errorMsg = `El archivo supera el tamaño máximo permitido (${sizeFormatted} de ${formatFileSize(maxSizeBytes)} máx).`;
    return {
      isValid: false,
      message: errorMsg,
      error: errorMsg,
      sizeFormatted,
      fileName: file.name
    };
  }

  if (file.size < minSizeBytes) {
    const errorMsg = 'El archivo seleccionado está vacío (0 bytes).';
    return {
      isValid: false,
      message: errorMsg,
      error: errorMsg,
      sizeFormatted,
      fileName: file.name
    };
  }

  // 3. Check Image validity & dimensions via browser Image object
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width === 0 || height === 0) {
        const errorMsg = 'No se pudo leer la imagen. El archivo parece estar dañado o incompleto.';
        resolve({
          isValid: false,
          message: errorMsg,
          error: errorMsg,
          sizeFormatted,
          fileName: file.name
        });
        return;
      }

      if (options.maxWidth && width > options.maxWidth) {
        const errorMsg = `La anchura de la imagen (${width}px) supera el máximo de ${options.maxWidth}px.`;
        resolve({
          isValid: false,
          message: errorMsg,
          error: errorMsg,
          width,
          height,
          dimensions: { width, height },
          sizeFormatted,
          fileName: file.name
        });
        return;
      }

      if (options.maxHeight && height > options.maxHeight) {
        const errorMsg = `La altura de la imagen (${height}px) supera el máximo de ${options.maxHeight}px.`;
        resolve({
          isValid: false,
          message: errorMsg,
          error: errorMsg,
          width,
          height,
          dimensions: { width, height },
          sizeFormatted,
          fileName: file.name
        });
        return;
      }

      if (options.minWidth && width < options.minWidth) {
        const errorMsg = `La anchura mínima requerida es ${options.minWidth}px (actual: ${width}px).`;
        resolve({
          isValid: false,
          message: errorMsg,
          error: errorMsg,
          width,
          height,
          dimensions: { width, height },
          sizeFormatted,
          fileName: file.name
        });
        return;
      }

      if (options.minHeight && height < options.minHeight) {
        const errorMsg = `La altura mínima requerida es ${options.minHeight}px (actual: ${height}px).`;
        resolve({
          isValid: false,
          message: errorMsg,
          error: errorMsg,
          width,
          height,
          dimensions: { width, height },
          sizeFormatted,
          fileName: file.name
        });
        return;
      }

      resolve({
        isValid: true,
        width,
        height,
        dimensions: { width, height },
        sizeFormatted,
        mime: file.type || `image/${ext}`,
        fileName: file.name
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const errorMsg = 'Error al procesar la imagen. Verifica que sea un archivo de imagen válido.';
      resolve({
        isValid: false,
        message: errorMsg,
        error: errorMsg,
        sizeFormatted,
        fileName: file.name
      });
    };

    img.src = objectUrl;
  });
}
