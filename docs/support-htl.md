
# HTL

[HTML Template Language](https://helpx.adobe.com/experience-manager/htl/user-guide.html) (also
referred to as HTL) is Adobe Experience Manager’s preferred and recommended server-side template
system for HTML.

## Info

There is a difference between HTL and other template languages that makes it tricky to properly
support all features, or to transpile into the cleanest code.

HTL itself is standard HTML5, and template directives are placed as HTML tags and attributes.
Handlebars is a string-based template engine, where control structures can be placed anywhere in the
document. If we were to literally transpile everything in place, it would end up as invalid HTML.
This is why there are some restrictions in usage of certain block tags in certain places.

To better work with those restrictions, we'll introduce Handlebars Helpers that can be transpiled
the proper way.

### if blocks

An example:

```html
<!-- hbs -->
<div {{#if foo }}class="{{foo}}" {{/if}}>
  foobar
</div>
```

In the above template, the `if` block has no context, so it doesn't know it's in the middle of an
HTML element. Replacing that with `<sli data-sly-test="${ foo }">` within the `<div` would result
in invalid HTML.

The proper outcome would be:

```html
<div data-sly-attribute.class="${ foo }">
  foobar
</div>
```

To make the translation better, we could introduce a handlebars helper to do the following:

```html
<div {{#attr class foo }}>
  foobar
</div>
```

It would still only allow `if` blocks outside of HTML tags, but it allows for a way to properly deal
with those scenarios.

### if else chaining

In Handlebars and other template languages, you have an `else` block that is rendered if `if`
expression is false. Additionally there is support for `else if` chaining.

In HTL there is no such concept. However, it allows you to store the result of the `if` statement
in a variable, and use it in a later `if`. If you negate that variable, you get the inverse, and
thus an `else`.

The transpiler will auto-generate those variables for all if-statements, and use them in `else` and
`else if` expressions. Additionally, you can name them in Handlebars by passing additional
parameters to the `if` block (that are ignored by the runtime).

The following example displays how the result of the `if` is used to create an else.

```html
{{if foo}}
  Foo
{{else}}
  Bar
{{/if}}
```

```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>
<sly data-sly-test=${ !(result1) }>
  Bar
</sly>
```

The example below shows how to name your resulting variable, and how multiple `if/elseif` cases are
used in the `else`. Notice the `as isFoo`.

```html
{{if foo as isFoo}}
  Foo
{{else if bar}}
  Bar
{{else}}
  Baz
{{/if}}
```

```html
<sly data-sly-test.isFoo=${ foo }>
  Foo
</sly>
<sly data-sly-test.result1=${ !(isFoo) || bar }>
  Bar
</sly>
<sly data-sly-test=${ !(isFoo || result1) }>
  Baz
</sly>
```

### Partials

Handlebars only has a single concept of partials. You can include af file (either statically or
dynamically) and optionally pass parameters.

In HTL you have two ways to include a partial, either by `data-sly-include` or by `data-sly-call`.

The first can include any HTL template file and executes it in isolation, there is no way to pass
variables to the template file.

The second requires that you first define a template with the variables you want to pass, then `use`
that template and `call` it with the variables you want to pass.

Since there is no way of telling how to include a Handlebars partial (in HTL you can call a
template without passing variables, which in Handlebars would look the same as including a template
file), and there is no way to tell how a template should be registered (either as normal file, or
in a template tag), we need to add some extra metadata/rules for this to work.

In Muban there is a concept of `blocks` vs `components`, where blocks can be rendered from code and
directly included on a page, and components can only be included within blocks or other components.
Following this division, we could mark blocks as normal template files, and components as template
tags. By disallowing you to include blocks in blocks, we should always use the `call` method.

### <sly> tags

In HTL is preferred to use `data-sly-*` attributes on existing HTML elements to add logic. In
Handlebars there is no such option; all logic is added around the HTML.

Luckily there is a `sly` tag in HTL that allows you to add logic to the DOM without introducing
new DOM elements. So this is the obvious target of all control-logic. The downside is that the
generated templates don't look as good as you would write them yourself.

There are valid reasons to use the `sly` tag though, for example when having to repeat two DOM
elements, or conditionally hide two DOM elements without having to duplicate the `data-sly-test`
on both elements.

However, when dealing with single elements, those attributes could be moved to the child or parent
DOM element to deliver cleaner templates. To detect this, one would need to create an actual DOM
and detect if the control element is a single child or contains only a single child. Since the
source template is no valid HTML, this is not possible.

Other options that work with the raw string are error-prone, since there is no way to know if a tag
is displayed as HTML, or as a comment or attribute value. One could create a custom parser, or try
to make guesses from the HBS AST, maybe this can be implemented in the future.

## Support

The following Handlebars to HTL conversions are currently supported:


* [comment](#comment)
  * [comment](comment/comment)
* [variable](#variable)
  * [variable](variable/variable)
  * [upper-context-variables](variable/upper-context-variables)
* [raw](#raw)
  * [raw](raw/raw)
* [if](#if)
  * [if](if/if)
  * [if-else](if/if-else)
  * [if-elseif](if/if-elseif)
  * [if-else-if](if/if-else-if)
  * [if-elseif-else](if/if-elseif-else)
  * [if-complex](if/if-complex)
* [for](#for)
  * [for](for/for)
  * [for-data](for/for-data)
  * [for-index](for/for-index)
  * [for-blockparams](for/for-blockparams)
  * [nested-for-blockparams](for/nested-for-blockparams)
  * [nested-for-conditional](for/nested-for-conditional)
  * [nested-for-data](for/nested-for-data)
* [partial](#partial)
  * [basic](partial/basic)
  * [dynamic](partial/dynamic)
  * [parameters](partial/parameters)



  ### comment
  
#### comment/comment

**hbs input**
```html
<div class="entry">
  {{!-- comment 1 --}}
  {{! comment 2 }}
  inline {{! comment 3 }} test
  <!-- html comment -->
</div>

```

**htl output**
```html
<div class="entry">
  <!--/* comment 1 */-->
  <!--/* comment 2 */-->
  inline <!--/* comment 3 */--> test
  <!-- html comment -->
</div>

```

  ### variable
  
#### variable/variable

**hbs input**
```html
<h1>{{ foo }}</h1>
<h1>{{ foo.bar }}</h1>

```

**htl output**
```html
<h1>${ foo }</h1>
<h1>${ foo.bar }</h1>

```

#### variable/upper-context-variables

**hbs input**
```html
{{#each users }}
  {{ name }}

  {{#each comments }}
    {{ ../name }} {{title}}

    {{#each commenter }}
      {{../../name}} {{name}}
    {{/each}}
  {{/each}}
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  ${ users_i.name }

  <sly data-sly-list.comments_i="${ users_i.comments }">
    ${ users_i.name } ${ comments_i.title }

    <sly data-sly-list.commenter_i="${ comments_i.commenter }">
      ${ users_i.name } ${ commenter_i.name }
    </sly>
  </sly>
</sly>

```

  ### raw
  
#### raw/raw

**hbs input**
```html
{{ escaped }}
{{{ notEscaped }}}

```

**htl output**
```html
${ escaped }
${ notEscaped @ context='html' }

```

  ### if
  
#### if/if

**hbs input**
```html
{{#if foo }}
  Foo
{{/if}}

```

**htl output**
```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>

```

#### if/if-else

**hbs input**
```html
{{#if foo as isFoo }}
  Foo
{{else}}
  Bar
{{/if}}

```

**htl output**
```html
<sly data-sly-test.isFoo=${ foo }>
  Foo
</sly>
<sly data-sly-test=${ !(isFoo) }>
  Bar
</sly>

```

#### if/if-elseif

**hbs input**
```html
{{#if foo }}
  Foo
{{else if bar }}
  Bar
{{/if}}

```

**htl output**
```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>
<sly data-sly-test.result2=${ !(result1) && bar }>
  Bar
</sly>

```

#### if/if-else-if

**hbs input**
```html
{{#if foo }}
  Foo
{{else}}
  {{# if bar }}
    Bar
  {{/if}}
  Baz
{{/if}}

```

**htl output**
```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>
<sly data-sly-test=${ !(result1) }>
  <sly data-sly-test.result2=${ bar }>
    Bar
  </sly>
  Baz
</sly>

```

#### if/if-elseif-else

**hbs input**
```html
{{#if foo }}
  Foo
{{else if bar }}
  Bar
{{else}}
  Foobar
{{/if}}

```

**htl output**
```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>
<sly data-sly-test.result2=${ !(result1) && bar }>
  Bar
</sly>
<sly data-sly-test=${ !(result1 || result2) }>
  Foobar
</sly>

```

#### if/if-complex

**hbs input**
```html
{{#if foo }}
  Foo
{{else if bar as isBar }}
  Bar
  {{#if bb }}
    bb
  {{/if}}
{{else if baz}}
  Baz
{{else}}
  Foobar
{{/if}}

```

**htl output**
```html
<sly data-sly-test.result1=${ foo }>
  Foo
</sly>
<sly data-sly-test.isBar=${ !(result1) && bar }>
  Bar
  <sly data-sly-test.result2=${ bb }>
    bb
  </sly>
</sly>
<sly data-sly-test.result3=${ !(result1 || isBar) && baz }>
  Baz
</sly>
<sly data-sly-test=${ !(result1 || isBar || result3) }>
  Foobar
</sly>

```

  ### for
  
#### for/for

**hbs input**
```html
{{#each users }}
  <a href="{{ foobar }}">link</a>
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  <a href="${ users_i.foobar }">link</a>
</sly>

```

#### for/for-data

**hbs input**
```html
{{#each users }}
  <a href="{{ foobar }}">{{ this }}</a>
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  <a href="${ users_i.foobar }">${ users_i }</a>
</sly>

```

#### for/for-index

**hbs input**
```html
{{#each users }}
  {{ @index }}: {{ this }}
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  ${ users_iList.index }: ${ users_i }
</sly>

```

#### for/for-blockparams

**hbs input**
```html
{{#each map as |value key| }}
  {{ key }}: {{ value }}
{{/each}}

```

**htl output**
```html
<sly data-sly-list.key="${ map }">
  ${ key }: ${ map[key] }
</sly>

```

#### for/nested-for-blockparams

**hbs input**
```html
{{#each users as |user| }}
  {{ user.name }}

  {{#each comments as |comment| }}
    {{ user.name }} {{comment.title}}
  {{/each}}

{{/each}}

```

**htl output**
```html
<sly data-sly-list.user="${ users }">
  ${ user.name }

  <sly data-sly-list.comment="${ user.comments }">
    ${ user.name } ${ comment.title }
  </sly>

</sly>

```

#### for/nested-for-conditional

**hbs input**
```html
{{#each users }}
  {{#if foo }}

    {{#each comments }}

      {{#if title}}
        <a href="{{ id }}">{{ name }}</a>
      {{/if}}

    {{/each}}

  {{else}}
    {{#each comments }}
      {{id}}
    {{/each}}
  {{/if}}
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  <sly data-sly-test.result1=${ users_i.foo }>

    <sly data-sly-list.comments_i="${ users_i.comments }">

      <sly data-sly-test.result2=${ comments_i.title }>
        <a href="${ comments_i.id }">${ comments_i.name }</a>
      </sly>

    </sly>

  </sly>
  <sly data-sly-test=${ !(result1) }>
    <sly data-sly-list.comments_i="${ users_i.comments }">
      ${ comments_i.id }
    </sly>
  </sly>
</sly>

```

#### for/nested-for-data

**hbs input**
```html
{{#each users }}
  <a href="{{ id }}">{{ name }}</a>
  {{#each comments }}
    {{ name }}
  {{/each}}
{{/each}}

```

**htl output**
```html
<sly data-sly-list.users_i="${ users }">
  <a href="${ users_i.id }">${ users_i.name }</a>
  <sly data-sly-list.comments_i="${ users_i.comments }">
    ${ comments_i.name }
  </sly>
</sly>

```

  ### partial
  
#### partial/basic

**hbs input**
```html
{{> foo/bar.hbs }}

```

**htl output**
```html
<sly data-sly-use.lib="foo/bar.html" data-sly-call="${ lib.bar }" />

```

#### partial/dynamic

**hbs input**
```html
{{> (lookup . 'myVariable') }}

```

**htl output**
```html
<sly data-sly-use.lib="${ myVariable }" data-sly-call="${ lib[myVariable] }" />

```

#### partial/parameters

**hbs input**
```html
{{> myPartial name=firstName age=18 foo="bar" baz=true }}

```

**htl output**
```html
<sly data-sly-use.lib="myPartial.html" data-sly-call="${ lib.myPartial @ name=firstName, age=18, foo='bar', baz=true }" />

```

