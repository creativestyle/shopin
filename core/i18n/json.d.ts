// Type declarations for JSON modules
declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}
