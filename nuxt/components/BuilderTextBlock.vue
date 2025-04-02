<template>
  <section class="builder-text-block pad-bl">
    <div class="cols gutter-lg">
      <!-- <div v-if="headline" class="col">
        <p class="fs-p1">{{ headline }}</p>
        <div v-if="tags" class="tags nav-a1">
          <span v-for="item in tags">{{ item.tag }}</span>
        </div>
      </div> -->
      <div class="col">
        <RichTextContent :content="richtext" />
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  headline: {
    type: String
  },
  richtext: {
    type: Array
  },
  tags: {
    type: Array
  }
});
</script>

<style lang='scss'>
.builder-text-block {
  .cols {
    .col {
      &:not(:first-child) {
        margin-top: $space-l;
      }

      .tags {
        width: 100%;
        max-width: 400px;
        line-height: 1.5em;
        margin-top: $space-l;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        span {
          display: inline-flex;
          align-items: center;

          &:not(:last-child) {
            &:after {
              content: '';
              width: 8px;
              height: 8px;
              margin: -0.05em 0.5em 0;
              display: inline-flex;
              align-items: center;
            }
          }

          &:nth-child(4n-1) {
            &:after {
              @include plus($gold);
            }
          }

          &:nth-child(4n-2) {
            &:after {
              @include plus($green);
            }
          }

          &:nth-child(4n-3) {
            &:after {
              @include plus($orange);
            }
          }

          &:nth-child(4n-4) {
            &:after {
              @include plus($purple);
            }
          }
        }
      }
    }
  }

  @include respond-to($tablet) {
    .cols {
      display: flex;
      justify-content: space-between;

      .col {
        width: span(6);

        &:not(:last-child) {
          width: span(5);
        }

        &:not(:first-child) {
          margin-top: 0px;
        }

        &:only-child {
          margin: 0 auto;
        }
      }
    }
  }
}
</style>
