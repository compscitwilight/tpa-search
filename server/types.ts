import { NodeType } from "./generated/prisma/enums.js"

export interface SearchQuery {
    q?: string
    skip?: string
    type?: NodeType | "All Types"
    uploader?: string
    beforeDate?: string
    afterDate?: string
}