import { useEffect, useState } from 'react'

interface PsgcItem {
    code: string
    name: string
}

interface UsePhAddressReturn {
    regions: PsgcItem[]
    provinces: PsgcItem[]
    cities: PsgcItem[]
    barangays: PsgcItem[]
    regionCode: string
    provinceCode: string
    cityCode: string
    noProvince: boolean
    loadingProvinces: boolean
    loadingCities: boolean
    loadingBarangays: boolean
    setRegion: (code: string, name: string) => void
    setProvince: (code: string, name: string) => void
    setCity: (code: string, name: string) => void
    setBarangay: (name: string) => void
    reset: () => void
    address: {
        region: string
        province: string
        city: string
        barangay: string
    }
}

const API_BASE = process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? ''
const listCache = new Map<string, PsgcItem[]>()
const inflight = new Map<string, Promise<PsgcItem[]>>()

const fetchAddressList = async (path: string, params?: Record<string, string>): Promise<PsgcItem[]> => {
    const query = new URLSearchParams(params ?? {})
    const url = `${API_BASE}/api/address/${path}${query.toString() ? `?${query.toString()}` : ''}`

    const cached = listCache.get(url)
    if (cached) return cached

    const pending = inflight.get(url)
    if (pending) return pending

    const request = fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    })
        .then((response) => (response.ok ? response.json() : { data: [] }))
        .then((payload: { data?: PsgcItem[] }) => (payload.data ?? []).sort((a, b) => a.name.localeCompare(b.name)))
        .catch(() => [])
        .finally(() => inflight.delete(url))

    inflight.set(url, request)
    const result = await request
    listCache.set(url, result)
    return result
}

export function usePhAddress(): UsePhAddressReturn {
    const [regions, setRegions] = useState<PsgcItem[]>([])
    const [provinces, setProvinces] = useState<PsgcItem[]>([])
    const [cities, setCities] = useState<PsgcItem[]>([])
    const [barangays, setBarangays] = useState<PsgcItem[]>([])

    const [regionCode, setRegionCode] = useState('')
    const [provinceCode, setProvinceCode] = useState('')
    const [cityCode, setCityCode] = useState('')
    const [noProvince, setNoProvince] = useState(false)

    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingCities, setLoadingCities] = useState(false)
    const [loadingBarangays, setLoadingBarangays] = useState(false)

    const [address, setAddress] = useState({
        region: '',
        province: '',
        city: '',
        barangay: '',
    })

    // Load regions on mount.
    useEffect(() => {
        let active = true

        fetchAddressList('regions').then((data) => {
            if (active) setRegions(data)
        })

        return () => {
            active = false
        }
    }, [])

    // Load provinces (or cities directly) when region changes.
    useEffect(() => {
        if (!regionCode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoadingProvinces(false)
            return
        }

        let active = true
        setLoadingProvinces(true)
        setProvinces([])
        setCities([])
        setBarangays([])

        const load = async () => {
            const provinceList = await fetchAddressList('provinces', { region_code: regionCode })
            if (!provinceList.length) {
                const cityList = await fetchAddressList('cities', { region_code: regionCode })
                if (active) {
                    setNoProvince(true)
                    setCities(cityList)
                }
                return
            }

            if (active) {
                setNoProvince(false)
                setProvinces(provinceList)
            }
        }

        load().finally(() => {
            if (active) setLoadingProvinces(false)
        })

        return () => {
            active = false
        }
    }, [regionCode])

    // Load cities when province changes.
    useEffect(() => {
        if (!provinceCode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoadingCities(false)
            return
        }

        let active = true
        setLoadingCities(true)
        setCities([])
        setBarangays([])

        fetchAddressList('cities', { province_code: provinceCode })
            .then((data) => {
                if (active) setCities(data)
            })
            .finally(() => {
                if (active) setLoadingCities(false)
            })

        return () => {
            active = false
        }
    }, [provinceCode])

    // Load barangays when city changes.
    useEffect(() => {
        if (!cityCode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoadingBarangays(false)
            return
        }

        let active = true
        setLoadingBarangays(true)
        setBarangays([])

        fetchAddressList('barangays', { city_code: cityCode })
            .then((data) => {
                if (active) setBarangays(data)
            })
            .finally(() => {
                if (active) setLoadingBarangays(false)
            })

        return () => {
            active = false
        }
    }, [cityCode])

    const setRegion = (code: string, name: string) => {
        setRegionCode(code)
        setProvinceCode('')
        setCityCode('')
        setAddress({ region: name, province: '', city: '', barangay: '' })
    }

    const setProvince = (code: string, name: string) => {
        setProvinceCode(code)
        setCityCode('')
        setAddress((prev) => ({ ...prev, province: name, city: '', barangay: '' }))
    }

    const setCity = (code: string, name: string) => {
        setCityCode(code)
        setAddress((prev) => ({ ...prev, city: name, barangay: '' }))
    }

    const setBarangay = (name: string) => {
        setAddress((prev) => ({ ...prev, barangay: name }))
    }

    const reset = () => {
        setRegionCode('')
        setProvinceCode('')
        setCityCode('')
        setNoProvince(false)
        setProvinces([])
        setCities([])
        setBarangays([])
        setAddress({
            region: '',
            province: '',
            city: '',
            barangay: '',
        })
    }

    return {
        regions,
        provinces,
        cities,
        barangays,
        regionCode,
        provinceCode,
        cityCode,
        noProvince,
        loadingProvinces,
        loadingCities,
        loadingBarangays,
        setRegion,
        setProvince,
        setCity,
        setBarangay,
        reset,
        address,
    }
}
