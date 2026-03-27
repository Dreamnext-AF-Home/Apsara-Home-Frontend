import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role?: string;
            userLevelId?: number;
            supplierId?: number | null;
            supplierName?: string | null;
            supplierLevelType?: number | null;
            isMainSupplier?: boolean;
            accessToken?: string
            passwordChangeRequired?: boolean
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string
        role?: string
        userLevelId?: number
        supplierId?: number | null
        supplierName?: string | null
        supplierLevelType?: number | null
        isMainSupplier?: boolean
        accessToken?: string
        passwordChangeRequired?: boolean
    }
}
