/*
 * Copyright (c) 2016 Hewlett Packard Enterprise Development Company, LP
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

'use strict';

var libDir = '../../../../generators/app/lib';

var gitignore = require(libDir + '/component/gitignore');
var projectBuilder = require(libDir + '/project_builder');
var mocks = require('../../../helpers/mocks');
var mockGenerator;

describe('generator-openstack:lib/component/gitignore', function () {

  beforeEach(function () {
    mockGenerator = mocks.buildGenerator();
    projectBuilder.clear();
  });

  it('should define init, prompt, and configure',
    function () {
      expect(typeof gitignore.init).toBe('function');
      expect(typeof gitignore.prompt).toBe('function');
      expect(typeof gitignore.configure).toBe('function');
    });

  describe('init()', function () {
    it('should return a generator',
      function () {
        var outputGenerator = gitignore.init(mockGenerator);
        expect(outputGenerator).toEqual(mockGenerator);
      });

    it('should not interact with config',
      function () {
        var spy = spyOn(mockGenerator.config, 'defaults');
        gitignore.init(mockGenerator);
        expect(spy.calls.any()).toBeFalsy();
      });
  });

  describe('prompt()', function () {
    it('should return a generator',
      function () {
        var outputGenerator = gitignore.prompt(mockGenerator);
        expect(outputGenerator).toEqual(mockGenerator);
      });

    it('should do nothing',
      function () {
        var spy = spyOn(mockGenerator, 'prompt');
        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        expect(spy.calls.any()).toBeFalsy();
      });
  });

  describe('configure()', function () {
    it('should return a generator',
      function () {
        var outputGenerator = gitignore.configure(mockGenerator);
        expect(outputGenerator).toEqual(mockGenerator);
      });

    it('should add gitignore to the project files.',
      function () {
        mockGenerator.fs.write('.gitignore', ['one', 'two'].join('\n'));
        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        expect(files.length).toBe(1);
        expect(files[0].to).toBe('.gitignore');
      });
  });

  describe('.gitignore management', function () {

    it('should echo back existing .gitignore',
      function () {
        mockGenerator.fs.write('.gitignore', ['one', 'two'].join('\n'));

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0];
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(2);

        expect(ignoreContent[0]).toEqual('one');
        expect(ignoreContent[1]).toEqual('two');
      });

    it('should include any files flagged as ignored in the project builder.',
      function () {
        mockGenerator.fs.write('.gitignore', '');
        projectBuilder.ignoreFile('foo/bar.json');

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0]; // There should only be one file.
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(1);

        expect(ignoreContent[0]).toBe('foo/bar.json');
      });

    it('should de-duplicate file paths from multiple locations.',
      function () {
        // include 'node_modules' from both an existing file and from the project builder.
        mockGenerator.fs.write('.gitignore', ['node_modules'].join('\n'));
        projectBuilder.ignoreFile('node_modules');

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0]; // There should only be one file.
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(1);

        expect(ignoreContent[0]).toBe('node_modules');
      });

    it('should sort the ignored files.',
      function () {
        mockGenerator.fs.write('.gitignore', ['b_line', 'a_line'].join('\n'));

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0];
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(2);
        expect(ignoreContent[0]).toBe('a_line');
        expect(ignoreContent[1]).toBe('b_line');
      });

    it('should remove any whitespace from the existing .gitignore',
      function () {
        mockGenerator.fs.write('.gitignore', ['1_one', '', '2_two', ''].join('\n'));

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0];
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(2);
        expect(ignoreContent[0]).toBe('1_one');
        expect(ignoreContent[1]).toBe('2_two');
      });

    it('should remove any comments from the existing .gitignore',
      function () {
        mockGenerator.fs.write('.gitignore', ['1_one', '# comment', '  #comment'].join('\n'));

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0];
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(1);
        expect(ignoreContent[0]).toBe('1_one');
      });

    it('should deduplicate content',
      function () {
        mockGenerator.fs.write('.gitignore', ['1_one', '1_one'].join('\n'));

        gitignore.init(mockGenerator);
        gitignore.prompt(mockGenerator);
        gitignore.configure(mockGenerator);

        var files = projectBuilder.getIncludedFiles();
        var ignoreRef = files[0];
        var ignoreContent = ignoreRef.content().split('\n');
        expect(ignoreContent.length).toBe(1);
        expect(ignoreContent[0]).toBe('1_one');
      });

    it('should delete the file if there\'s nothing to ignore', function () {
      mockGenerator.fs.write('.gitignore', '');

      gitignore.init(mockGenerator);
      gitignore.prompt(mockGenerator);
      gitignore.configure(mockGenerator);

      var files = projectBuilder.getIncludedFiles();
      expect(files.length).toBe(0);

      var rmFiles = projectBuilder.getExcludedFiles();
      expect(rmFiles.length).toBe(1);
      expect(rmFiles[0]).toBe('.gitignore');
    });
  });
});
