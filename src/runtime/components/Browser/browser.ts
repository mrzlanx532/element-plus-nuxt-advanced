export type IItem = {[key: string]: any}

export interface IFilter {
    id: string
    title: string
    type: FilterType
    options?: {
        id: string
        title: string
    }[]
    config: IFilterConfig
}

export const enum FilterType {
    SELECT = 'SELECT',
    SELECT_SEARCH = 'SELECT_SEARCH',
    INPUT = 'INPUT',
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    BOOLEAN = 'BOOLEAN',
}

export interface IFilterConfig {
    filter: boolean
    hidden: boolean
    mask: string|null
    multiple: boolean
    range: boolean
    url: string
    nullable: boolean
    is_timestamp: boolean
    strategy: string
}

export interface IResponse {
    filters: IFilter[],
    items: IItem[],
    meta: {
        browser_id: string,
        count: number,
        page: number,
        per_page: number,
        searchable: boolean,
        sort: string[]
    }
}
