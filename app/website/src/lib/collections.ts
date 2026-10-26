
import type { CollectionEntry } from 'astro:content';

import { getCollection } from 'astro:content';
// import { z } from 'astro/zod';


import type { PackageId } from './packages';

/** Each package's docs live in a collection named after its id */
type Doc = CollectionEntry<PackageId>
type DocData = Doc['data']

// export const docCollectionSchema = z.object({
//     title: z.string(),
//     subtitle: z.string(),
//     root: z.literal(true).optional()
// })

// type DocCollectionProps = z.infer<typeof docCollectionSchema>

// type BaseCollectionProps = Omit<Doc, 'data'>

type DocRouteBase = {
    path: string[];
    /** Last segment of the path, i.e. the name used in a parent's `index` */
    name: string;
    children: DocRoute[];
}

/** md/mdx entry with a body - has its own page */
export type PageRoute = DocRouteBase & { kind: 'page'; doc: Doc; data: DocData };
/** Entry without a body (i.e. index.json) - titles a group of children */
export type GroupRoute = DocRouteBase & { kind: 'group'; doc: null; data: DocData };
/** Folder with no entry of its own */
export type FolderRoute = DocRouteBase & { kind: 'folder'; doc: null; data: null };

export type DocRoute = PageRoute | GroupRoute | FolderRoute;

/** Mutable route used while building the tree - converted to a DocRoute by `finalize` */
type DraftRoute = {
    path: string[];
    name: string;
    entry?: Doc;
    children: Map<string, DraftRoute>;
}

const getPath = (doc: Doc) => doc.id.split('/');

/** Orders children by the entry's `index` list, then the remaining children in default order */
const sortChildren = (draft: DraftRoute): DraftRoute[] => {
    const index = draft.entry?.data.index ?? [];
    const listed = new Set<string>();

    const ordered = index.map(name => {
        const child = draft.children.get(name);

        if (!child) {
            const available = [...draft.children.keys()].join(', ') || 'none';
            throw new Error(`Doc of path: ${draft.path.join('/')} lists "${name}" in its index, but has no direct child of that name. Available children: ${available}`);
        }
        if (listed.has(name)) {
            throw new Error(`Doc of path: ${draft.path.join('/')} lists "${name}" more than once in its index.`);
        }

        listed.add(name);
        return child;
    });

    const remaining = [...draft.children]
        .filter(([name]) => !listed.has(name))
        .map(([, child]) => child);

    return [...ordered, ...remaining];
}

const finalize = (draft: DraftRoute): DocRoute => {
    const { path, name, entry } = draft;
    const children = sortChildren(draft).map(finalize);

    if (!entry) {
        return { kind: 'folder', path, name, children, doc: null, data: null };
    }

    return entry.body
        ? { kind: 'page', path, name, children, doc: entry, data: entry.data }
        : { kind: 'group', path, name, children, doc: null, data: entry.data };
}

export const getDocPages = (docs: Doc[]): DocRoute[] => {

    const root: DraftRoute = {
        path: [],
        name: '',
        children: new Map()
    };



    const [ absoluteRoot, ...docRoutes ] = docs;
    // the __root path is alphabetically sorted to be the first item in the collection
    // automatically by Astro. If something causes this to change, build will throw
    // and we will need to implement a more robust sort manually
    if (absoluteRoot.id !== "__root") throw new Error("The absolute root [__root} is not the first index item in `docs`");



    docRoutes.forEach(doc => {
        const docPath = getPath(doc);
        let current = root;

        docPath.forEach((segment, i) => {
            if (!segment) {
                throw new Error(`Doc of path: ${doc.id} has an invalid route.`);
            }

            let next = current.children.get(segment);

            if (!next) {
                next = {
                    path: docPath.slice(0, i + 1),
                    name: segment,
                    children: new Map()
                }
                current.children.set(segment, next);
            }
            // console.log("next docpath: ", JSON.stringify(docPath.slice(0, i + 1)));

            // console.log("current: ", JSON.stringify({
                
            // }, null, 2))

            current = next;
            // console.log("Docpath length: ", String(docPath.length), "  i: ", String(i))
            // console.log("Distance: ", String(docPath.length - (i + 1)))
            // if (docPath.length === (i + 1)) {
            //     console.log("current: ", JSON.stringify({
            //         ...current
            //     }, null, 2))
            // }
        });
        

        current.entry = doc;

        // console.log("Curr: ", current)
    })

    root.entry = absoluteRoot

    // const absoluteRootSetup = ({
    //     path: [],
    //     name: absoluteRoot.id,
    //     children: new
    // } satisfies DraftRoute)

    return sortChildren(root).map(finalize);
}

/** The navigation tree for one package's docs */
export const getDocList = async (pkg: PackageId) => getDocPages(await getCollection(pkg));
