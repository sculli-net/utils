
I'm working on a native html/js components that emulate the composable nature of libraries like [base-ui](https://base-ui.com/) with some opinionated defaults and came across a limitation of the [slot](https://docs.astro.build/en/basics/astro-components/#slots) implementation in astro components.

```text
components/
├── ui/
│   ├── dialog/
│   │   ├── Dialog-Content.astro
│   │   ├── Dialog-Footer.astro
│   │   ├── Dialog-Header.astro
│   │   ├── Dialog-Overlay.astro
│   │   ├── Dialog-Trigger.astro
│   │   └── Dialog.astro
│   └── ...
└── ...
```


This feature request has been raised before ([issue #13266](https://github.com/withastro/astro/issues/13266)) and there was a proposal which would allow the desired architecture ([discussion #1159](https://github.com/withastro/roadmap/discussions/1159)) though it is possible to narrow the scope for a simple implementation that does not interfere with current functionality.

## Possible implementations
1. Defined export
	Declare the desired slot name from frontmatter.

	```astro
	---
	export const compositionSlot = 'header'
	---
	
	<div>
	
	</div>
	```
2. Template directive
	To not differ too much from the current API, the introduction of a special slot declaration would could this functionality (i.e. `slot:compose=""`). The addition of the template directive helps the compiler identify that the child must be inspected to correctly place it in the correct slot and avoids breaking any code which expects for slots to not transfer through components.
3. Astro.slots.compose('header')
	Alternatively we could use a template expression with Astro.slots within the parent to create this compositional slot type. This would allow the copiler to identify that it needs to check the child for any slot name declarations in the outermost element.
	i.e.

	```astro
	<div>
		<!-- default slot  -->
		<slot /> 

		<!-- named slot  -->
		<slot name="content" /> 

		<!-- composable slot  -->
		{Astro.slots.compose("footer")}
	</div>
	```

