<template>
  <section id="contact" class="contact-section">
    <div class="container">
      <div class="greeting">
        <h2>Hi Sam,</h2>

        <div class="note">
          <p>Please fill this out if you want to chat!</p>
        </div>
      </div>
      <div class="form-wrapper">
        <form
          name="contact"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          @submit.prevent="handleSubmit"
        >
          <input type="hidden" name="form-name" value="contact" />
          <div class="hidden">
            <label>Don't fill this out if you're human: <input name="bot-field" /></label>
          </div>

          <div class="form-row">
            <label>My name is</label>
            <input
                type="text"
                id="name"
                name="name"
                v-model="formData.name"
                required
                placeholder="Your name"
              />
           
          </div>

          <div class="form-row">
            <span>I want some help with</span>
            <div class="dropdown-wrapper project-type">
              <select name="project_type" v-model="formData.projectType" required>
                <option value="" disabled selected>Project type</option>
                <option value="website">Website</option>
                <option value="branding">Branding</option>
                <option value="application">Application</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <label>My budget is</label>
          </div>

          <div class="form-row">
           
            <div class="dropdown-wrapper">
              <select name="budget" v-model="formData.budget" required>
                <option value="" disabled selected>$1,000,000</option>
                <option value="less_than_5k">Less than $5,000</option>
                <option value="5k_to_10k">$5,000 - $10,000</option>
                <option value="10k_to_25k">$10,000 - $25,000</option>
                <option value="25k_to_50k">$25,000 - $50,000</option>
                <option value="50k_to_100k">$50,000 - $100,000</option>
                <option value="more_than_100k">More than $100,000</option>
              </select>
            </div>
            <label>reach me at</label>
          </div>

       

          <div class="form-row">
         
            <input
              type="email"
              id="email"
              name="email"
              v-model="formData.email"
              required
              placeholder="Email"
            />

            <div class="form-actions">
              <button
                type="submit"
                :disabled="submitting"
              >
                <p v-if="submitting">Sending...</p>
                <p v-else>LET'S COOK</p>
              </button>
            </div>
          </div>

          <div v-if="formSubmitted" class="form-feedback">
            <div v-if="submitSuccess" class="success-message">
              Thank you for your message! We'll get back to you shortly.
            </div>
            <div v-else class="error-message">
              {{ errorMessage }}
          </div>
       </div>
      </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const formData = ref({
  name: '',
  email: '',
  budget: '',
  projectType: '',
});

const submitting = ref(false);
const formSubmitted = ref(false);
const submitSuccess = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  submitting.value = true;
  formSubmitted.value = false;
  
  try {
    const formDataObj = new FormData();
    formDataObj.append('form-name', 'contact');
    formDataObj.append('name', formData.value.name);
    formDataObj.append('email', formData.value.email);
    formDataObj.append('budget', formData.value.budget);
    formDataObj.append('project_type', formData.value.projectType); // <-- match field name

    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formDataObj).toString()
    });
    
    if (response.ok) {
      formSubmitted.value = true;
      submitSuccess.value = true;
      formData.value = { name: '', email: '', budget: '', projectType: '' };
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    formSubmitted.value = true;
    submitSuccess.value = false;
    errorMessage.value = 'There was an error submitting the form. Please try again later.';
    console.error('Form submission error:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
// Variables
$transition-normal: all 0.3s ease;

.contact-section {
  padding: 3rem 0;
  background-color: $red;
  color: $black;
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;

  .container {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 2rem;
    
    @media (max-width: 768px) {
      padding: 0 1.5rem;
    }
  }

  .greeting {
    margin-bottom: 2rem;
    display: flex; 
    align-items: center; 
    justify-content: space-between;

    @media (max-width: 768px) {
      display: block; 
      padding: 0 1rem;
    }

    h2 {
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0;
      
      @media (max-width: 768px) {
        margin-bottom: 12px;
      }
    }
  }

  .note {
    // position: absolute;
    // top: 2rem;
    // right: 2rem;
    // font-size: 0.9rem;

    @media (max-width: 768px) {
      // position: static;
      // text-align: right;
      // margin-top: 1rem;
    }
  }

  .form-wrapper {
    width: 100%;
    
    @media (min-width: 768px) {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
    }
    
    form {
      width: 100%;
      .hidden {
        display: none;
      }

      .form-row {
        display: flex;
        align-items: center;  
        margin-bottom: 1.5rem;
        justify-content: center;
        flex-wrap: wrap;

        @media (max-width: 768px) {
          flex-direction: column;
          align-items: flex-start;
          padding: 0 1rem;
        }

          label {
          margin-right: 1rem;
          font-size: 1.2rem;

          @media (max-width: 768px) {
            margin-bottom: 0.5rem;
          }
        }

        input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid $black;
          border-radius: $radius-xs;
          background: transparent;
          font-size: 1.1rem;
          color: $black;
          max-width: 300px;
          margin: 0 1rem;

          &::placeholder {
            color: rgba($black, 0.7);
          }
          &:focus {
            outline: none;
          }

          @media (max-width: 768px) {
            width: 90%;
            margin: 0.5rem 0;
            max-width: 100%;
          }
        }
        
        select {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid $black;
          border-radius: $radius-xs;
          font-size: 1.1rem;
          max-width: 300px;
          margin: 0 1rem;
          
          &:focus {
            outline: none;
          }

          @media (max-width: 768px) {
            width: 100%;
            margin: 0.5rem 0;
            max-width: 100%;
          }
        }

        span {
          margin-left: 1rem;
          font-size: 1.2rem;

          @media (max-width: 768px) {
            margin: 0.5rem 0;
          }
        }

        .dropdown-wrapper {
          position: relative;
          max-width: 300px;
          flex: 1;
          margin: 0 1rem;
          border-radius: $radius-xs;
          overflow: hidden;

          @media (max-width: 768px) {
            width: 100%;
            margin: 0.5rem 0;
            max-width: 100%;
          }

          &:after {
            content: '⌄';
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: $red;
            font-size: 16px;
            pointer-events: none;
          }

          select {
            appearance: none;
            width: 100%;
            margin: 0;
            padding-right: 2.5rem;
            background-color: $black;
            color: $red;
            border: 1px solid $black;
            
            option {
              background-color: $black;
              color: $red;
            }
          }

          &.project-type {
            max-width: 200px;

            @media (max-width: 768px) {
              max-width: 100%;
            }
          }
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        
        @media (max-width: 768px) {
          padding: 0 1rem;
          margin-top: 2rem;
        }

        button {
          @include pill($black, $white, $black, 0.75rem, 2.5rem, 1rem, 0);
          font-weight: 500;
          cursor: pointer;
          transition: $transition-normal;
          text-transform: uppercase;

          &:hover {
            color: $red;
          }

          &:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        }
      }

      .form-feedback {
        margin-top: 1.5rem;
        
        @media (max-width: 768px) {
          padding: 0 1rem;
        }
        .success-message {
          color: $white;
          font-weight: 500;
          background-color: rgba($black, 0.7);
          padding: 0.75rem 1rem;
          border-radius: $radius-xs;
        }

        .error-message {
          color: $white;
          font-weight: 500;
          background-color: rgba($black, 0.7);
          padding: 0.75rem 1rem;
          border-radius: $radius-xs;
        }
      }
    }
  }
}
</style>
