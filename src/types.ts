type Endpoint = {
  url: string
  method: string
  tags: string[]
  summary: string
  description: string
  query: any
  params: any
  body: any
  response: {
    [status: number]: any 
  }
}