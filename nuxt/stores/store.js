import { defineStore } from 'pinia';
import { typeFilter, imageProps } from '~/utils/groq-common';

export const useSiteStore = defineStore('site', {
  state: () => ({
    accessibility: false,
    loading: true,
    site_name: 'Portfolio',
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
      try {
        const siteQuery = groq` {
          'site': ${typeFilter('site')} {
            siteName,
            headerTitle,
            footerTitle,
            generalLabel,
            businessLabel,
            generalEmail,
            address,
            addressLink
          }
        }`;
        
        // Use the composable instead of useSanityQuery
        const data = await useSanityData({ query: siteQuery });
        
        console.log('Site data fetched:', data);

        // Check if data and data.site exist before accessing properties
        if (data && data.site) {
          // Site settings
          this.site_name = data.site.siteName || this.site_name;
          this.header_title = data.site.headerTitle || '';
          this.footer_title = data.site.footerTitle || '';
          this.general_label = data.site.generalLabel || '';
          this.business_label = data.site.businessLabel || '';
          this.general_email = data.site.generalEmail || '';
          this.address = data.site.address || '';
          this.address_link = data.site.addressLink || '';
        } else {
          console.warn('No site data found in Sanity response');
        }
        
        this.loading = false;
      } catch (error) {
        console.error('Error fetching site content:', error);
        this.loading = false;
      }
    }
  }
})
