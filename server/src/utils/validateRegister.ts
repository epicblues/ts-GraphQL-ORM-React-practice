import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  // 구체적인 UserResponse 객체로 return 하지 않는 이유
  // UserResponse가 바뀌면 여기 코드까지 다 바꿔야 하기 때문
  // 여기서는 그냥 error의 배열 형태로만 return 하고 
  // 나머지는 그 결과를 활용하는 Context에서 처리

  if (options.username.length <= 2)
    return [
      {
        field: "username",
        message: "length must be greater than 2",
      },
    ];

  if (options.username.includes("@"))
    return [
      {
        field: "username",
        message: "Username must not include @ character",
      },
    ];

  if (options.password.length <= 3)
    return [
      {
        field: "password",
        message: "length must be greater than 3",
      },
    ];

  if (!/^(\w+)(\.\w+)*@(\w+)(\.\w+)+$/.test(options.email!))
    return [
      {
        field: "email",
        message: "Invalid Email Input",
      },
    ];

  return null;
};
