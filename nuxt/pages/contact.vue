<template>
  <div id="contact-page" class="page space-t">
    <BuilderGeneralBlock
      v-if="block"
      :title="block.title"
      :text="block.text"
    />
    <BuilderHeroText
      :title="'contact'"
      titleAs="h1"
      :circularText="'Fill Out Form *PLEASE* '"
      :backgroundColor="red"
      :textColor="black"
      :rotationSpeed="20"
      :direction="clockwise"
      :fontSize="5"
    />
    <section class="container mx-auto px-4 py-12">
      <ContactForm />
    </section>
    <Footer />
  </div>
</template>

<script setup>
import BuilderGeneralBlock from '~/components/BuilderGeneralBlock.vue';
import ContactForm from '~/components/ContactForm.vue';
import Footer from '~/components/Footer.vue';
import { useSiteStore } from '~/stores/store';

const store = useSiteStore();

const contactQuery = groq`*[(_type == "contact")][0]{
  blocks[] {
    _type == 'generalBlock' => {
      'type': _type,
      title,
      text
    }
  }
}`;

const pageData = await useSanityData({ query: contactQuery });
const block = pageData?.blocks?.find(b => b.type === 'generalBlock');

useSeoMeta({
  title: `Contact | ${store.site_name}`,
  ogTitle: `Contact | ${store.site_name}`,
  description: 'Contact Sam Herwig',
  ogDescription: 'Contact Sam Herwig'
});
</script>

<style lang="scss">
#contact-page {
  min-height: 100vh;
  background: $white;
}
</style> 
