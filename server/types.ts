import { NodeType } from "./generated/prisma/enums.ts"

export interface SearchQuery {
    q?: string
    page?: string
    type?: NodeType
}