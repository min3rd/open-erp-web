/**
 * Utility functions for mapping administrative entities to TreeNode structures
 */
import type {
  AdministrativeEntity,
  AdministrativeTreeNode,
  Province,
  District,
  Ward,
} from '../province.types';

/**
 * Map a single administrative entity to a TreeNode
 * @param entity - The administrative entity to map
 * @param hasChildren - Whether this node has children (for lazy loading)
 * @returns TreeNode representation of the entity
 */
export function mapToTreeNode(
  entity: AdministrativeEntity,
  hasChildren = false
): AdministrativeTreeNode {
  return {
    key: entity.code,
    data: entity,
    leaf: !hasChildren && entity.scope === 'ward', // Wards are always leaf nodes
    expanded: false,
    children: hasChildren ? [] : undefined,
  };
}

/**
 * Map an array of entities to TreeNodes
 * @param entities - Array of entities to map
 * @returns Array of TreeNode representations
 */
export function mapToTreeNodes(entities: AdministrativeEntity[]): AdministrativeTreeNode[] {
  return entities.map((entity) => {
    // Provinces and districts can have children
    const hasChildren = entity.scope === 'province' || entity.scope === 'district';
    return mapToTreeNode(entity, hasChildren);
  });
}

/**
 * Build a hierarchical tree structure from flat data
 * @param entities - Flat array of entities
 * @returns Tree structure with nested children
 */
export function buildTree(entities: AdministrativeEntity[]): AdministrativeTreeNode[] {
  const entityMap = new Map<string, AdministrativeTreeNode>();
  const rootNodes: AdministrativeTreeNode[] = [];

  // First pass: create all nodes
  entities.forEach((entity) => {
    const node = mapToTreeNode(entity, false);
    entityMap.set(entity.code, node);
  });

  // Second pass: build parent-child relationships
  entities.forEach((entity) => {
    const node = entityMap.get(entity.code);
    if (!node) return;

    if (entity.parentCode) {
      const parent = entityMap.get(entity.parentCode);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
        parent.leaf = false;
      }
    } else {
      // Root level nodes (provinces)
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * Update a tree node's children
 * @param tree - The tree structure to update
 * @param parentKey - The key of the parent node to update
 * @param children - The new children nodes
 * @returns Updated tree structure
 */
export function updateNodeChildren(
  tree: AdministrativeTreeNode[],
  parentKey: string,
  children: AdministrativeTreeNode[]
): AdministrativeTreeNode[] {
  return tree.map((node) => {
    if (node.key === parentKey) {
      return {
        ...node,
        children,
        expanded: true,
        loading: false,
        leaf: children.length === 0,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, parentKey, children),
      };
    }
    return node;
  });
}

/**
 * Find a node in the tree by its key
 * @param tree - The tree structure to search
 * @param key - The key to search for
 * @returns The found node or undefined
 */
export function findNodeByKey(
  tree: AdministrativeTreeNode[],
  key: string
): AdministrativeTreeNode | undefined {
  for (const node of tree) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Get the display label for an entity based on its scope
 * @param scope - The entity scope
 * @returns Translated scope label key
 */
export function getScopeLabel(scope: string): string {
  const scopeMap: Record<string, string> = {
    province: 'provinceList.scope.province',
    district: 'provinceList.scope.district',
    ward: 'provinceList.scope.ward',
  };
  return scopeMap[scope] || scope;
}

/**
 * Determine if an entity can have children based on its scope
 * @param entity - The entity to check
 * @returns true if the entity can have children
 */
export function canHaveChildren(entity: AdministrativeEntity): boolean {
  return entity.scope === 'province' || entity.scope === 'district';
}

/**
 * Get the child scope for a given parent scope
 * @param parentScope - The parent entity's scope
 * @returns The child scope or undefined if no children are possible
 */
export function getChildScope(parentScope: string): 'district' | 'ward' | undefined {
  if (parentScope === 'province') return 'district';
  if (parentScope === 'district') return 'ward';
  return undefined;
}

/**
 * Flatten a tree structure into a flat array
 * @param tree - The tree structure to flatten
 * @returns Flat array of entities
 */
export function flattenTree(tree: AdministrativeTreeNode[]): AdministrativeEntity[] {
  const result: AdministrativeEntity[] = [];

  function traverse(nodes: AdministrativeTreeNode[]) {
    nodes.forEach((node) => {
      result.push(node.data);
      if (node.children) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return result;
}
