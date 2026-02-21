import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(value: bigint | string | number, decimals = 18): string {
    if (value === undefined || value === null) return "0";
    try {
        let formatted = "";
        if (typeof value === 'bigint') {
            formatted = ethers.formatUnits(value, decimals);
        } else {
            formatted = ethers.formatUnits(value.toString(), decimals);
        }

        // Remove trailing zeros after decimal point
        return formatted.replace(/\.?0+$/, "");
    } catch (e) {
        return value.toString();
    }
}
