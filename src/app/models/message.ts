export interface Message {
    id: string
    message: string
    category: string
    isCompleted: boolean
  }

  export interface NewMessage {
    message: string
    category: string
    isCompleted: boolean
  }