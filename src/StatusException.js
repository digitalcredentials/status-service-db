export default function StatusException(code, message, originalError) {
    this.code = code
    this.message = message
    this.originalError = originalError
}