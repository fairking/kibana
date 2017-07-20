import expect from 'expect.js';
import ngMock from 'ng_mock';
import { IndicesGetIndicesProvider } from 'ui/indices/get_indices';

describe('GetIndices', function () {
  let indicesResponse;
  let aliasesResponse;
  let getIndices;

  beforeEach(ngMock.module('kibana', ($provide) => {
    indicesResponse = {
      data: [
        { index: '.kibana' },
        { index: '.monitoring-es-2' },
        { index: '.monitoring-es-3' },
        { index: '.monitoring-es-4' },
        { index: '.monitoring-es-5' }
      ]
    };
    aliasesResponse = {
      data: {
        '.monitoring-es-1': {
          aliases: {
            '.monitoring-es-active': {}
          }
        }
      }
    };

    $provide.service('$http', function () {
      return {
        async get(path) {
          if (path.includes('aliases')) {
            return aliasesResponse;
          }
          if (path.includes('indices')) {
            return indicesResponse;
          }
          throw new Error(`Unexpected path to $http.get(): ${path}`);
        }
      };
    });
  }));

  beforeEach(ngMock.inject((Private) => {
    getIndices = Private(IndicesGetIndicesProvider);
  }));

  it('should be a function', function () {
    expect(getIndices).to.be.a(Function);
  });

  it('should rely on the alias endpoint if it returns a non 404', async function () {
    const indices = await getIndices();
    expect(indices.length).to.be(2);
    expect(indices[0]).to.be('.monitoring-es-1');
    expect(indices[1]).to.be('.monitoring-es-active');
  });

  it('should fallback to the cat indices endpoint if there are no aliases', async function () {
    const aliasesResponseCopy = Object.assign({}, aliasesResponse);
    aliasesResponse = { status: 404 };
    const indices = await getIndices();
    expect(indices.length).to.be(indicesResponse.data.length);
    indicesResponse.data.forEach((indexObj, idx) => {
      expect(indices[idx]).to.be(indexObj.index);
    });
    aliasesResponse = aliasesResponseCopy;
  });
});
