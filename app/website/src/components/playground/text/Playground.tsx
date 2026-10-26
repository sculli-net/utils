import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import './playground.css';

/** Query parameter that holds the input text, so a link reopens the same text. */
const PARAM = 'text';

interface Analysis {
	/** The input broken into words, as shown on the stage. */
	tokens: string[];
	characters: number;
	lines: number;
}

const encoder = new TextEncoder();

/**
 * Placeholder analysis until the @sculli/text-utils sources land. Swap the body for calls
 * into the library (it resolves straight to ../../lib via the Vite alias, no build needed).
 */
function analyse(text: string): Analysis {
	const tokens = text.split(/\s+/).filter(Boolean);
	return { tokens, characters: [...text].length, lines: text === '' ? 0 : text.split('\n').length };
}

function readParam(): string {
	if (typeof window === 'undefined') return '';
	return new URLSearchParams(window.location.search).get(PARAM) ?? '';
}

function writeParam(text: string) {
	const url = new URL(window.location.href);
	if (text) url.searchParams.set(PARAM, text);
	else url.searchParams.delete(PARAM);
	if (url.href !== window.location.href) history.replaceState(history.state, '', url);
}

type CopyState = 'idle' | 'copied' | 'failed';

export default function Playground() {
	const inputId = useId();
	const statusId = useId();
	const [text, setText] = useState('');
	const deferred = useDeferredValue(text);
	const result = useMemo(() => analyse(deferred), [deferred]);
	const [copy, setCopy] = useState<CopyState>('idle');

	useEffect(() => {
		const initial = readParam();
		if (initial) setText(initial);
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(() => writeParam(deferred), 250);
		return () => window.clearTimeout(timer);
	}, [deferred]);

	useEffect(() => {
		if (copy === 'idle') return;
		const timer = window.setTimeout(() => setCopy('idle'), 1600);
		return () => window.clearTimeout(timer);
	}, [copy]);

	const ready = result.tokens.length > 0;
	const bytes = encoder.encode(text).length;

	async function copyOutput() {
		if (!ready) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(result.tokens));
			setCopy('copied');
		} catch {
			setCopy('failed');
		}
	}

	return (
		<section className="group/playground mx-auto flex w-full max-w-[36rem] flex-col gap-5" aria-label="Text utils playground">
			<div className="relative min-h-48 w-full p-5" data-state={ready ? 'ready' : 'empty'}>
				<span aria-hidden="true" className="pg-tick top-0 left-0 border-t border-l" />
				<span aria-hidden="true" className="pg-tick top-0 right-0 border-t border-r" />
				<span aria-hidden="true" className="pg-tick right-0 bottom-0 border-r border-b" />
				<span aria-hidden="true" className="pg-tick bottom-0 left-0 border-b border-l" />

				{ready ? (
					<ol className="flex flex-wrap gap-1.5 font-mono text-sm" aria-label="Words">
						{result.tokens.map((token, index) => (
							<li key={`${index}:${token}`} className="pg-token rounded-sm bg-neutral-100 px-1.5 py-0.5 text-neutral-900">
								{token}
							</li>
						))}
					</ol>
				) : (
					<p className="grid min-h-38 place-items-center text-sm text-neutral-400">Output will appear here</p>
				)}
			</div>

			{/* Two lines tall at all times, so a wrapped readout never moves the input */}
			<div className="flex min-h-10 items-center justify-between gap-4">
				<div id={statusId} className="text-xs leading-5">
					{ready ? <Readout result={result} /> : <p className="text-neutral-500">Nothing to process yet</p>}
				</div>
				<div className="flex shrink-0 gap-1">
					<IconButton label={copy === 'copied' ? 'Copied output' : copy === 'failed' ? 'Copy failed' : 'Copy output'} disabled={!ready} onClick={copyOutput}>
						{copy === 'copied' ? <CheckIcon /> : <CopyIcon />}
					</IconButton>
				</div>
				<p className="sr-only" aria-live="polite">
					{copy === 'copied' ? 'Output copied to the clipboard' : copy === 'failed' ? 'Could not copy the output' : ''}
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-baseline justify-between">
					<label htmlFor={inputId} className="text-sm font-medium text-neutral-900">
						Text
					</label>
					<span className="font-mono text-xs text-neutral-500 tabular-nums">
						{bytes} {bytes === 1 ? 'byte' : 'bytes'}
					</span>
				</div>
				<textarea
					id={inputId}
					value={text}
					onChange={(event) => setText(event.target.value)}
					aria-describedby={statusId}
					rows={3}
					spellCheck={false}
					autoComplete="off"
					placeholder="A sentence, a paragraph, anything"
					className="field-sizing-content max-h-64 min-h-[5.5rem] w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base leading-6 text-neutral-900 caret-amber-600 transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-500 selection:bg-amber-200 hover:border-neutral-400 focus:border-neutral-900 focus:shadow-[0_0_0_3px_var(--color-amber-200)] focus:outline-none"
				/>
			</div>
		</section>
	);
}

function Readout({ result }: { result: Analysis }) {
	return (
		<p className="flex flex-wrap gap-x-3 font-mono">
			<Value label="words" value={String(result.tokens.length)} />
			<Value label="chars" value={String(result.characters)} />
			<Value label="lines" value={String(result.lines)} />
		</p>
	);
}

/** A readout value. It flashes amber when it changes. */
function Value({ label, value }: { label: string; value: string }) {
	return (
		<span className="whitespace-nowrap">
			<span key={value} className="pg-value text-neutral-900 tabular-nums">
				{value}
			</span>{' '}
			<span className="text-neutral-500">{label}</span>
		</span>
	);
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			disabled={disabled}
			onClick={onClick}
			className="grid size-8 place-items-center rounded-md text-neutral-600 transition-colors duration-150 hover:bg-neutral-900/10 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 active:bg-neutral-900/15 disabled:pointer-events-none disabled:text-neutral-300 [&_svg]:size-4"
		>
			{children}
		</button>
	);
}

const iconProps = {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true,
} as const;

function CopyIcon() {
	return (
		<svg {...iconProps}>
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg {...iconProps}>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}
