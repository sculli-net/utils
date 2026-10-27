/**
 * Abandoning this approach as the experimental_AstroContainer does not have access to global scripts & styles
 */


import type { APIRoute, APIContext } from "astro";


import { bannerMetrics, packagePaths, packageList, pkgHref, type Package } from '@/lib/packages';

export const getStaticPaths = packagePaths;

import { experimental_AstroContainer } from "astro/container";
import NotFound from "./_404.astro";

const container = await experimental_AstroContainer.create();

// const experimental_AstroPages = (ctx: APIContext) => Promise.all(getStaticPaths().map( async (path)=>{
//     // return { id: path.params.pkg, html: `Oh no this isn't found!!!` }; -> this works
//     // return { id: path.params.pkg, html: await container.renderComponent(NotFound) }
//     return { id: path.params.pkg, html: await container.renderToString(NotFound, {
//         props: path.props
//     })};
// })).then((result => result.reduce((acc, curr)=>{
//     const pkg = curr.id;
//     return {
//         ...acc,
//         [pkg]: curr.html
//     }
// }, {} as Record<string, string>)))


export const GET = async ({ props: { pkg } }:APIContext) => await container.renderToString(NotFound, {
    props: { pkg }
}).then(r=>
    new Response(r, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 404,
      statusText: "Not found",
}));
// export const GET = ({ props: { pkg } }:APIContext) =>
//     new Response(`<!doctype html><html><body>${pkg.id}</body></html>`, {
//       headers: { 'Content-Type': 'text/html; charset=utf-8' },
//       status: 404,
//       statusText: "Not found",
// });