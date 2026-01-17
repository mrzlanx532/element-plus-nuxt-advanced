export interface SetLinkFormData {
    link: string
    text: string
    inNewWindow: boolean
}

export interface SetImageFormData {
    entity_id: number,
    entity_type: string,
    image: File | undefined
}