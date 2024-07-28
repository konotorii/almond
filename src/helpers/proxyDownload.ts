import {Request, Response} from 'express';

export default async function proxyPrivateDownload(asset: any, token: string, req: Request, res: Response) {
    const redirect = 'manual'
    const headers: HeadersInit = {Accept: 'application/octet-stream', Authorization: `token ${token}`};

    const {api_url: rawUrl} = asset

    // const finalUrl = rawUrl.replace(
    //     'https://api.github.com/',
    //     `https://${token}@api.github.com/`
    // )

    const assetRes = await fetch(rawUrl, {
        headers,
        redirect,
    })

    res.setHeader('Location', assetRes.headers.get('Location') || "")
    res.status(302)
}