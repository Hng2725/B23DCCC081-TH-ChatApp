export type LoginErrors = { email: string; password: string };
export type RegistrationValues = { name: string; email: string; password: string; confirmPassword: string };
export type RegistrationErrors = LoginErrors & { name: string; confirmPassword: string };

export function validateLogin(email: string, password: string): LoginErrors {
  return {
    email: email.trim() ? '' : 'Email không được để trống',
    password: password ? '' : 'Mật khẩu không được để trống',
  };
}

export function validateRegistration(values: RegistrationValues): RegistrationErrors {
  const loginErrors = validateLogin(values.email, values.password);
  return {
    name: values.name.trim() ? '' : 'Họ tên không được để trống',
    email: loginErrors.email,
    password: values.password.length >= 6 ? '' : 'Mật khẩu phải có ít nhất 6 ký tự',
    confirmPassword: values.password === values.confirmPassword ? '' : 'Mật khẩu xác nhận không khớp',
  };
}
