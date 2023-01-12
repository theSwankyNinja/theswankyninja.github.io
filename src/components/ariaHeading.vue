<template>
    <div class="maincontent" role="tabpanel">
        <slot name="heading" aria-level="2">
        <h2 role="heading" aria-labbelledby="{{contentLabel}}">Heading</h2>
        </slot>
        <div id="content">
            <slot>
                <p>content</p>
            </slot>
        </div>
    </div>
</template>