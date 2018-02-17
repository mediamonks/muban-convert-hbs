
# Twig

[Twig](https://twig.symfony.com/) is a modern template engine for PHP. It's used by popular
frameworks like [Symfony](https://symfony.com/) and [Drupal](https://www.drupal.org/).

## Support

The following Handlebars to Twig conversions are currently supported:


* [comment](#comment)
  * [comment](#commentcomment)
* [variable](#variable)
  * [variable](#variablevariable)
  * [upper-context-variables](#variableupper-context-variables)
* [raw](#raw)
  * [raw](#rawraw)
* [if](#if)
  * [if](#ifif)
  * [if-else](#ifif-else)
  * [if-elseif](#ifif-elseif)
  * [if-else-if](#ifif-else-if)
  * [if-elseif-else](#ifif-elseif-else)
* [for](#for)
  * [for](#forfor)
  * [for-data](#forfor-data)
  * [for-index](#forfor-index)
  * [for-blockparams](#forfor-blockparams)
  * [for-key](#forfor-key)
  * [nested-for-blockparams](#fornested-for-blockparams)
  * [nested-for-conditional](#fornested-for-conditional)
  * [nested-for-data](#fornested-for-data)
* [partial](#partial)
  * [basic](#partialbasic)
  * [context](#partialcontext)
  * [dynamic](#partialdynamic)
  * [parameters](#partialparameters)



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
  {# comment 1 #}
  {# comment 2 #}
  inline {# comment 3 #} test
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
<h1>{{ foo }}</h1>
<h1>{{ foo.bar }}</h1>

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
{% for users_i in users %}
  {{ users_i.name }}

  {% for comments_i in users_i.comments %}
    {{ users_i.name }} {{ comments_i.title }}

    {% for commenter_i in comments_i.commenter %}
      {{ users_i.name }} {{ commenter_i.name }}
    {% endfor %}
  {% endfor %}
{% endfor %}

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
{{ escaped }}
{{ notEscaped|raw }}

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
{% if foo %}
  Foo
{% endif %}

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
{% if foo %}
  Foo
{% else %}
  Bar
{% endif %}

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
{% if foo %}
  Foo
{% elif bar %}
  Bar
{% endif %}

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
{% if foo %}
  Foo
{% else %}
  {% if bar %}
    Bar
  {% endif %}
  Baz
{% endif %}

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
{% if foo %}
  Foo
{% elif bar %}
  Bar
{% else %}
  Foobar
{% endif %}

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
{% for users_i in users %}
  <a href="{{ users_i.foobar }}">link</a>
{% endfor %}

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
{% for users_i in users %}
  <a href="{{ users_i.foobar }}">{{ users_i }}</a>
{% endfor %}

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
{% for users_i in users %}
  {{ loop.index0 }}: {{ users_i }}
{% endfor %}

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
{% for key, value in map|cast_to_array %}
  {{ key }}: {{ value }}
{% endfor %}

```

#### for/for-key

**hbs input**
```html
{{#each map }}
  {{ @key }}: {{ this }}
{{/each}}

```

**htl output**
```html
{% for key, map_i in map|cast_to_array %}
  {{ key }}: {{ map_i }}
{% endfor %}

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
{% for user in users %}
  {{ user.name }}

  {% for comment in user.comments %}
    {{ user.name }} {{ comment.title }}
  {% endfor %}

{% endfor %}

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
{% for users_i in users %}
  {% if users_i.foo %}

    {% for comments_i in users_i.comments %}

      {% if comments_i.title %}
        <a href="{{ comments_i.id }}">{{ comments_i.name }}</a>
      {% endif %}

    {% endfor %}

  {% else %}
    {% for comments_i in users_i.comments %}
      {{ comments_i.id }}
    {% endfor %}
  {% endif %}
{% endfor %}

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
{% for users_i in users %}
  <a href="{{ users_i.id }}">{{ users_i.name }}</a>
  {% for comments_i in users_i.comments %}
    {{ comments_i.name }}
  {% endfor %}
{% endfor %}

```

### partial
  
#### partial/basic

**hbs input**
```html
{{> foo/bar.hbs }}

```

**htl output**
```html
{% include 'foo/bar.html' %}

```

#### partial/context

**hbs input**
```html
{{! this is not supported in django }}
{{> myPartial myOtherContext }}

```

**htl output**
```html
{# this is not supported in django #}
{% include 'myPartial.html' with myOtherContext %}

```

#### partial/dynamic

**hbs input**
```html
{{> (lookup . 'myVariable') }}

```

**htl output**
```html
{% include myVariable %}

```

#### partial/parameters

**hbs input**
```html
{{> myPartial name=firstName age=18 foo="bar" baz=true }}

```

**htl output**
```html
{% include 'myPartial.html' with {'name':firstName, 'age':18, 'foo':"bar", 'baz':true} %}

```

