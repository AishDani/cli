/* eslint-disable camelcase */
'use strict';

/**
 * In this scenario We have Blog content type having author_name field.
 * We have a requirement to create separate content type to store authors and refer it in Blog content type.
 * We are transforming Blog content type where we are creating authors from 'author_name' field and then referring it to respective entries in blog.
 */

module.exports = async ({ migration, stackSDKInstance }) => {
  const blogUID = 'blog6';
  const blogTitle = 'Blog6';
  const authorUID = 'author6';
  const authorTitle = 'Author6';

  // *********************** START: Preparing the scenario ************************//
  /**
   * Create Blog content type
   */
  const blog = migration
    .createContentType(blogUID)
    .title(blogTitle)
    .description('Awesome blogs here')
    .isPage(true)
    .singleton(false);

  blog.createField('title').display_name('Title').data_type('text').mandatory(true);

  blog.createField('url').display_name('URL').data_type('text').mandatory(true);

  blog.createField('author_name').display_name('Author Name').data_type('text').mandatory(true);

  let jsonRTE = {
    data_type: 'text',
    display_name: 'Body',
    field_metadata: {
      allow_rich_text: true,
      rich_text_type: 'advanced',
      description: '',
      default_value: '',
    },
  };

  let group = {
    data_type: 'group',
    display_name: 'Group',
    field_metadata: {},
    schema: [
      {
        data_type: 'text',
        display_name: 'Single line textbox',
        uid: 'single_line',
        field_metadata: {
          description: '',
          default_value: '',
          version: 3,
        },
        format: '',
        error_messages: {
          format: '',
        },
        multiple: false,
        mandatory: false,
        unique: false,
        indexed: false,
        inbuilt_model: false,
        non_localizable: false,
      },
    ],
    multiple: false,
    mandatory: false,
    unique: false,
    indexed: false,
    inbuilt_model: false,
    non_localizable: false,
  };

  blog.createField('body', jsonRTE);
  blog.createField('group1', group);

  migration.addTask(blog.getTaskDefinition());

  /**
   * add entries to blog content type
   */
  let entries = [];
  let createEntryTask = {
    title: 'Create blog entries',
    successMessage: 'Blog entries added successfully.',
    failedMessage: 'Failed to add Blog entries.',
    task: async () => {
      try {
        for (let index = 0; index < 4; index++) {
          let entry = {
            title: `Awesome Blog ${index}`,
            url: `/awesome-blog-${index}`,
            body: `This is ${index} blog.`,
            author_name: `Firstname-${index} Lastname-${index}`,
          };
          let entryObj = await stackSDKInstance.contentType(blogUID).entry().create({ entry });
          entries.push(entryObj);
        }
      } catch (error) {
        console.log(error);
      }
    },
  };

  migration.addTask(createEntryTask);

  // *********************** END: Preparing the scenario ************************//

  /**
   * Create author content type
   */
  const author = migration.createContentType(authorUID).title(authorTitle).isPage(false).singleton(false);

  author.createField('title').display_name('Title').data_type('text').mandatory(true);

  author.createField('url').display_name('URL').data_type('text').mandatory(true);

  author.createField('firstname').display_name('First Name').data_type('text').mandatory(false);

  author.createField('lastname').display_name('Last Name').data_type('text').mandatory(false);

  migration.addTask(author.getTaskDefinition());

  /**
   * Create reference filed for author content type in blog
   */
  const blogEdit = migration.editContentType(blogUID);
  blogEdit.createField('author').data_type('reference').reference_to([authorUID]).ref_multiple(false);

  migration.addTask(blogEdit.getTaskDefinition());

  /**
   * add entries to author content type and link it to Derived entry of blog content type
   */
  let createAuthorsTaskAndRefInBlog = {
    title: 'Create authors derived from blog author_name',
    successMessage: 'Authors created successfully.',
    task: async (params) => {
      for (let index = 0; index < entries.length; index++) {
        let blogEntry = entries[index];
        if (blogEntry.author_name) {
          let author_name = blogEntry.author_name.split(' ');
          let entry = {
            title: blogEntry.author_name,
            url: `/${blogEntry.author_name.replace(' ', '-')}`,
            firstname: author_name[0],
            lastname: author_name[1],
          };
          const entryI = stackSDKInstance.contentType(authorUID).entry();
          // Create Author entry
          let entryObj = await entryI.create({ entry });
          // Add reference to blog entry
          blogEntry.author = [];
          blogEntry.author.push({ uid: entryObj.uid, _content_type_uid: entryObj.content_type_uid });
          await blogEntry.update();
        }
      }
    },
  };
  migration.addTask(createAuthorsTaskAndRefInBlog);
};

// Change and publish example - Done
// Add to Release and deploy example - Done

// Extension example

// Merge option
// master > Dev
// apply back to master
// master > Dev
// Master > dev2 > Script
// Master new brach > changes apply > test

// NOTE: @contentstack/management token should have branch access README content
