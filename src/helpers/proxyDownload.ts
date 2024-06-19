import {send} from 'micro';
import {Request, Response} from 'express';

export default async function proxyPrivateDownload(asset: any, token: string, req: Request, res: Response) {
    const redirect = 'manual'
    const headers: HeadersInit = {Accept: 'application/octet-stream'}

    const {api_url: rawUrl} = asset

    const finalUrl = rawUrl.replace(
        'https://api.github.com/',
        `https://${token}@api.github.com/`
    )

    const assetRes = await fetch(finalUrl, {
        headers,
        redirect,
    })

    res.setHeader('Location', assetRes.headers.get('Location') || "")
    send(res, 302)
}