import { Type, type Static } from '@sinclair/typebox'
import { AUTH_PWD } from '../config/auth'

const nameString = Type.String({
  minLength:    3,
  maxLength:    20,
  pattern:      '^[a-zA-ZÀ-ÖØ-öø-ÿ\\s.\\-]+$', // Allows letters, spaces, dots and hyphens
  default:      '',
  errorMessage: 'Three or more letters, spaces, dots or hyphens'
})

const emailString = Type.String({
  format:       'email',
  default:      '', // removes ambiguity when using Value.Create()
  errorMessage: 'A valid email address'
})

const passwordString = Type.String({
  minLength:    AUTH_PWD.MIN,
  maxLength:    AUTH_PWD.MAX,
  default:      '',
  errorMessage: `Must be between ${AUTH_PWD.MIN} and ${AUTH_PWD.MAX} characters`
})

export const RegisterSchema = Type.Object({
  name:     nameString,
  email:    emailString,
  password: passwordString
})

export const LoginSchema = Type.Object({
  email:    emailString,
  password: passwordString
})

export type Register = Static<typeof RegisterSchema>
export type Login = Static<typeof LoginSchema>
