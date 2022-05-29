// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from "ethers";

require('dotenv').config();


type Balances = {
  hasBalance: boolean
  networksWithBalance: [string?]
} | {
  error: string
}

const mainnetProvider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_API);

const networks: {name: string, provider: ethers.providers.JsonRpcProvider}[] = [
  {
    name: 'mainnet',
    provider: mainnetProvider,
  },
  {
    name: 'arbitrum',
    provider: new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_API),
  },
  {
    name: 'optimism',
    provider: new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_API),
  },
  {
    name: 'polygon',
    provider: new ethers.providers.JsonRpcProvider(process.env.POLYGON_API),
  },
]

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

async function resolve(address: string): Promise<string | null> {
  return await mainnetProvider.resolveName(address)
}

async function checkBalances(address: string) : Promise<Balances> {
  let hasBalance = false
  let networksWithBalance: [string?] = []

  let resolvedAddress = isValidAddress(address) ? address : (await resolve(address))

  if (address == null) {
    return {
      error: "Couldn't resolve address"
    }  
  }

  for (const network of networks) {
    const {name, provider} = network
    const balance = await provider.getBalance(resolvedAddress!);
    if (!balance.isZero()) {
      hasBalance = true
      networksWithBalance.push(name)
    }      
  }

  return {
    hasBalance,
    networksWithBalance,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Balances>
) {
  const { address } = req.query
  res.status(200).json(await checkBalances(address as string))
}
