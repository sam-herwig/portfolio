import { defineStore } from 'pinia';
import { typeFilter, imageProps } from '~/utils/groq-common';

export const useSiteStore = defineStore('site', {
  state: () => ({
    accessibility: false,
    loading: true,
    site_name: '',
    site_seo_description: '',
    site_seo_image: '',
    header_title: '',
    footer_title: '',
    general_label: '',
    business_label: '',
    general_email: '',
    address: '',
    address_link: '',
    case_studies: [],
    hide_header: false,
    menu_open: false,
    site_nav: [
      { id: 'work', label: 'Work' },
      { id: 'capabilities', label: 'Capabilities' },
      { id: 'leadership', label: 'Leadership' }
    ],
    preview_is_active: false
  }),
  actions: {
    setAccessibilityOff() {
      this.accessibility = false;
    },
    setAccessibilityOn() {
      this.accessibility = true;
    },
    setHideHeader() {
      this.hide_header = true;
    },
    setShowHeader() {
      this.hide_header = false;
    },
    setMenuOpen() {
      this.menu_open = true;
    },
    setMenuClose() {
      this.menu_open = false;
    },
    async fetchSiteContent() {
      const siteQuery = groq` {
        'site': ${typeFilter('site')} {
          siteName,
          headerTitle,
          footerTitle,
          generalLabel,
          businessLabel,
          address,
          addressLink
        }
      }`;
      const { data, error } = await useSanityQuery(siteQuery);

      // console.log(data.value)

      const site_data = data.value.site || {};
      // const home_data = data.value.home;


      // Site settings
      this.site_name = site_data.siteName;
      // this.site_seo_description = site_data.seoSocial?.description;
      // this.site_seo_image = site_data.seoSocial?.image;

      // Header setings...
      this.header_title = site_data.headerTitle;

      // Footer setings...
      this.footer_title = site_data.footerTitle;
      this.general_label = site_data.generalLabel;
      this.business_label = site_data.businessLabel;

      // Contact settings...
      this.general_email = site_data.generalEmail;
      this.address = site_data.address;
      this.addressLink = site_data.addressLink;

      // Case Studies...
      // this.case_studies = home_data.caseStudies;
    }
  }
})
